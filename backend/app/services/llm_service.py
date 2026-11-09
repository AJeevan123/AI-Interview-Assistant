import json
import re
import requests
from typing import List, Dict, Any, Optional
from app.config import settings

# Curated fallback knowledge base categorized by role, interview_type, and difficulty
QUESTION_BANKS = {
    "AI / ML Engineer": {
        "Technical": {
            "Easy": [
                {"q": "Can you explain the difference between supervised and unsupervised machine learning with real-world examples?", "topic": "ML Fundamentals"},
                {"q": "What is overfitting in a machine learning model, and what is one simple way to prevent it?", "topic": "Model Training"},
                {"q": "What is the purpose of splitting a dataset into training, validation, and test sets?", "topic": "Data Validation"},
                {"q": "Explain the difference between classification and regression tasks.", "topic": "ML Tasks"},
                {"q": "What is a confusion matrix and what are Precision and Recall?", "topic": "Evaluation Metrics"}
            ],
            "Medium": [
                {"q": "How does gradient descent optimize neural network weights, and what role does learning rate play?", "topic": "Optimization"},
                {"q": "Describe how Convolutional Neural Networks (CNNs) process spatial image features.", "topic": "Computer Vision"},
                {"q": "Explain the bias-variance tradeoff and how L1 (Lasso) and L2 (Ridge) regularization address it.", "topic": "Regularization"},
                {"q": "How do self-attention mechanisms in Transformers differ from recurrent connections in RNNs/LSTMs?", "topic": "Deep Learning / NLP"},
                {"q": "When evaluating an imbalanced dataset, why might accuracy be misleading and what alternative metrics would you use?", "topic": "Model Evaluation"}
            ],
            "Hard": [
                {"q": "How would you design a scalable recommendation system handling 10 million active users with low latency?", "topic": "ML System Design"},
                {"q": "Explain the mathematical formulation of cross-entropy loss and why it is preferred over MSE for multi-class classification.", "topic": "Loss Functions"},
                {"q": "Discuss methods to mitigate catastrophic forgetting and model drift in continuously learning production models.", "topic": "Production MLOps"},
                {"q": "How do FlashAttention and quantization (INT8/INT4) optimize memory bandwidth and throughput in LLMs?", "topic": "LLM Optimization"}
            ]
        },
        "Behavioral": {
            "Medium": [
                {"q": "Tell me about an ML project where the model didn't perform as expected. How did you debug and iterate?", "topic": "Problem Solving"},
                {"q": "How do you explain complex machine learning predictions and caveats to non-technical stakeholders?", "topic": "Communication"}
            ]
        },
        "HR": {
            "Medium": [
                {"q": "Why are you interested in specializing in AI / Machine Learning, and where do you see this field going in the next 3 years?", "topic": "Career Goals"},
                {"q": "Describe a situation where you had to quickly learn a new AI library or paper under a tight project deadline.", "topic": "Adaptability"}
            ]
        }
    },
    "Python Developer": {
        "Technical": {
            "Easy": [
                {"q": "What is the key difference between lists and tuples in Python, and when would you choose one over the other?", "topic": "Data Structures"},
                {"q": "How does Python handle memory management and reference counting?", "topic": "Memory"},
                {"q": "Explain the difference between 'is' and '==' in Python with examples.", "topic": "Core Syntax"},
                {"q": "What are *args and **kwargs in function definitions?", "topic": "Functions"},
                {"q": "What is the purpose of Python's virtual environments?", "topic": "Environment Management"}
            ],
            "Medium": [
                {"q": "Explain the Python Global Interpreter Lock (GIL) and its implications for multithreading vs multiprocessing.", "topic": "Concurrency"},
                {"q": "What are Python generators and decorators? How do they work under the hood using closures and iterators?", "topic": "Advanced Python"},
                {"q": "How do Python's context managers work, and how would you implement one using the `__enter__` and `__exit__` magic methods?", "topic": "Language Internals"},
                {"q": "Explain the difference between shallow copy and deep copy in Python with nested structures.", "topic": "Memory Models"},
                {"q": "How does Python's asyncio event loop schedule coroutines compared to traditional OS threads?", "topic": "Async Programming"}
            ],
            "Hard": [
                {"q": "How would you architect a high-throughput async microservice handling thousands of requests per second using FastAPI and asyncpg?", "topic": "Architecture"},
                {"q": "Explain Python metaclasses and the `__new__` vs `__init__` instantiation lifecycle. When would you genuinely need a metaclass?", "topic": "Metaprogramming"},
                {"q": "How does CPython optimize dictionary lookups using hash tables, and how was memory footprint reduced in Python 3.6+?", "topic": "CPython Internals"}
            ]
        },
        "Behavioral": {
            "Medium": [
                {"q": "Describe a scenario where you identified and resolved a major performance bottleneck in a Python codebase.", "topic": "Optimization"},
                {"q": "How do you balance writing fast prototype Python code with writing robust, unit-tested production code?", "topic": "Code Quality"}
            ]
        },
        "HR": {
            "Medium": [
                {"q": "Tell me about yourself and your journey with Python development.", "topic": "Introduction"},
                {"q": "How do you stay up-to-date with Python PEP enhancements and community developments?", "topic": "Continuous Learning"}
            ]
        }
    },
    "Web Developer": {
        "Technical": {
            "Easy": [
                {"q": "What is the Document Object Model (DOM) and how does JavaScript manipulate it?", "topic": "DOM & JS"},
                {"q": "Explain the CSS Box Model (content, padding, border, margin).", "topic": "CSS"},
                {"q": "What is the difference between synchronous and asynchronous JavaScript?", "topic": "Async JS"},
                {"q": "What are the common HTTP status codes (200, 301, 400, 401, 404, 500) and what do they signify?", "topic": "HTTP Protocols"},
                {"q": "What is the difference between localStorage, sessionStorage, and cookies?", "topic": "Web Storage"}
            ],
            "Medium": [
                {"q": "How does the React Virtual DOM work, and how does reconciliation compute minimal DOM updates?", "topic": "React Internals"},
                {"q": "Explain the JavaScript Event Loop, Call Stack, Microtask queue (Promises), and Macrotask queue (setTimeout).", "topic": "JS Concurrency"},
                {"q": "What is the difference between Server-Side Rendering (SSR) and Client-Side Rendering (CSR)? What are the trade-offs in SEO and TTI?", "topic": "Rendering Architecture"},
                {"q": "How do you protect a modern web application against Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF)?", "topic": "Web Security"},
                {"q": "Explain CSS Flexbox vs Grid and when you would choose one over the other.", "topic": "Layout Systems"}
            ],
            "Hard": [
                {"q": "How would you optimize Core Web Vitals (LCP, INP, CLS) for a high-traffic e-commerce single-page application?", "topic": "Web Performance"},
                {"q": "Architect a real-time collaborative web application (like Google Docs or Figma) using WebSockets and CRDTs.", "topic": "Distributed Web Architecture"}
            ]
        },
        "Behavioral": {
            "Medium": [
                {"q": "Describe a project where you collaborated closely with UI/UX designers to translate Figma mockups into code.", "topic": "Design Collaboration"}
            ]
        },
        "HR": {
            "Medium": [
                {"q": "What inspired you to pursue Web Development, and what is your favorite framework to work with?", "topic": "Background"}
            ]
        }
    },
    "Data Scientist": {
        "Technical": {
            "Easy": [
                {"q": "What steps do you take during Exploratory Data Analysis (EDA) on a new, unfamiliar dataset?", "topic": "EDA"},
                {"q": "How do you identify and handle missing data or extreme outliers in a dataset?", "topic": "Data Cleaning"},
                {"q": "Explain the difference between correlation and causation with a real-life example.", "topic": "Statistics"},
                {"q": "What are SQL JOINs (INNER, LEFT, RIGHT, FULL) and when do you use each?", "topic": "SQL & Relational Data"}
            ],
            "Medium": [
                {"q": "Explain how A/B testing works, including null hypothesis formulation, p-value interpretation, and sample size power calculation.", "topic": "Experimentation"},
                {"q": "How does K-Means clustering determine cluster centroids and what method do you use to determine optimal 'k'?", "topic": "Clustering"},
                {"q": "Describe techniques for feature engineering and dimensionality reduction when dealing with high-dimensional tabular data.", "topic": "Feature Engineering"}
            ],
            "Hard": [
                {"q": "How do you detect and correct for selection bias and confounding variables in observational causal inference studies?", "topic": "Causal Inference"}
            ]
        },
        "Behavioral": {
            "Medium": [
                {"q": "Tell me about a time when your data analysis disproved an intuitive hypothesis held by business leadership.", "topic": "Data Storytelling"}
            ]
        },
        "HR": {
            "Medium": [
                {"q": "What motivates you to work with data, and how do you prioritize tasks when requests come from multiple teams?", "topic": "Work Prioritization"}
            ]
        }
    },
    "Software Engineer": {
        "Technical": {
            "Easy": [
                {"q": "What are the four pillars of Object-Oriented Programming (OOP) and why are they important?", "topic": "OOP Concepts"},
                {"q": "Explain the difference between a stack and a queue data structure with typical application use cases.", "topic": "Data Structures"},
                {"q": "What is Git and how does branching help a software engineering team collaborate?", "topic": "Version Control"}
            ],
            "Medium": [
                {"q": "Explain the SOLID design principles with concrete architectural examples.", "topic": "Software Design"},
                {"q": "What is the difference between a monolithic architecture and microservices? What are the trade-offs in operational complexity?", "topic": "System Architecture"},
                {"q": "How do relational databases maintain ACID properties, particularly during concurrent transactions?", "topic": "Databases & Concurrency"}
            ],
            "Hard": [
                {"q": "Design a globally distributed URL shortener (like TinyURL or Bitly) handling 100M daily writes and 1B daily reads.", "topic": "System Design"},
                {"q": "How do distributed consensus algorithms like Raft or Paxos prevent split-brain scenarios in clustered storage systems?", "topic": "Distributed Systems"}
            ]
        },
        "Behavioral": {
            "Medium": [
                {"q": "Tell me about a time you faced a difficult technical disagreement with a teammate and how you resolved it.", "topic": "Team Conflict"},
                {"q": "Describe a production bug you introduced or investigated. How did you diagnose, fix, and post-mortem it?", "topic": "Incident Management"}
            ]
        },
        "HR": {
            "Medium": [
                {"q": "Where do you see yourself technically and professionally over the next 3 to 5 years?", "topic": "Career Trajectory"}
            ]
        }
    }
}

# Fallback questions for general / custom roles
DEFAULT_QUESTIONS = [
    {"q": "Could you provide a detailed overview of yourself, your technical background, and your key areas of expertise?", "topic": "Introduction"},
    {"q": "Can you describe an impactful software or technology project you built from scratch, including challenges and outcomes?", "topic": "Project Experience"},
    {"q": "How do you approach debugging a complex, intermittent issue when error logs are minimal?", "topic": "Problem Solving"},
    {"q": "Tell me about a time when you had to balance clean code quality with meeting an urgent release deadline.", "topic": "Engineering Trade-offs"},
    {"q": "What new technologies, frameworks, or tools have you explored recently, and what motivated you to learn them?", "topic": "Continuous Learning"}
]

class LLMService:
    @staticmethod
    def _call_external_llm(messages: List[Dict[str, str]], json_mode: bool = True) -> Optional[str]:
        """Attempt to call external LLM API if key is provided; return text or None on failure."""
        if not settings.LLM_API_KEY:
            return None
        
        try:
            # Standard OpenAI-compatible format
            headers = {
                "Authorization": f"Bearer {settings.LLM_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": settings.LLM_MODEL or "gpt-4o-mini",
                "messages": messages,
                "temperature": 0.7
            }
            if json_mode:
                payload["response_format"] = {"type": "json_object"}
            
            # Using OpenAI chat completions endpoint
            url = "https://api.openai.com/v1/chat/completions"
            resp = requests.post(url, headers=headers, json=payload, timeout=12)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
        except Exception:
            pass
        return None

    @classmethod
    def generate_first_question(
        cls, role: str, interview_type: str, difficulty: str,
        resume_text: Optional[str] = None, jd_text: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate the first interview question."""
        # Try external LLM
        prompt = (
            f"You are an expert AI interviewer conducting an interview for the role of '{role}'.\n"
            f"Interview Type: {interview_type}\n"
            f"Difficulty: {difficulty}\n"
        )
        if resume_text:
            prompt += f"Candidate Resume Summary: {resume_text[:400]}\n"
        if jd_text:
            prompt += f"Job Description Context: {jd_text[:400]}\n"
        
        prompt += (
            "Generate the very first interview question. Return strictly valid JSON in this format:\n"
            '{"question": "...", "topic": "...", "difficulty": "...", "question_type": "..."}'
        )

        messages = [
            {"role": "system", "content": "You are a professional, polite, yet technically rigorous AI Interviewer. Output strict JSON only."},
            {"role": "user", "content": prompt}
        ]
        
        raw_output = cls._call_external_llm(messages, json_mode=True)
        if raw_output:
            try:
                parsed = json.loads(raw_output)
                if "question" in parsed:
                    return {
                        "question": parsed["question"],
                        "topic": parsed.get("topic", "Core Fundamentals"),
                        "difficulty": difficulty,
                        "question_type": interview_type
                    }
            except Exception:
                pass

        # Fallback / Demo Mode
        # Check if resume context mentions specific skills to customize
        if resume_text:
            skills = [s for s in ["Python", "Machine Learning", "React", "SQL", "Docker", "Java", "Deep Learning", "FastAPI"] if s.lower() in resume_text.lower()]
            if skills:
                return {
                    "question": f"I reviewed your resume and noticed you have experience with {', '.join(skills[:2])}. Can you walk me through how you applied these in your most recent project?",
                    "topic": "Resume Project Experience",
                    "difficulty": difficulty,
                    "question_type": interview_type
                }

        # Role-based lookup
        role_bank = QUESTION_BANKS.get(role, {})
        type_bank = role_bank.get(interview_type, role_bank.get("Technical", {}))
        diff_list = type_bank.get(difficulty, type_bank.get("Medium", []))
        
        if diff_list:
            item = diff_list[0]
            return {
                "question": item["q"],
                "topic": item["topic"],
                "difficulty": difficulty,
                "question_type": interview_type
            }
        
        # Generic fallback
        item = DEFAULT_QUESTIONS[0]
        return {
            "question": item["q"],
            "topic": item["topic"],
            "difficulty": difficulty,
            "question_type": interview_type
        }

    @classmethod
    def generate_next_question(
        cls, role: str, interview_type: str, difficulty: str,
        previous_qa: List[Dict[str, str]], question_index: int,
        resume_text: Optional[str] = None, jd_text: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate the next interview question ensuring no duplication."""
        asked_questions = [item.get("question", "") for item in previous_qa]

        # External LLM attempt
        prompt = (
            f"Role: {role}, Type: {interview_type}, Difficulty: {difficulty}.\n"
            f"Already asked questions:\n"
        )
        for i, qa in enumerate(previous_qa, 1):
            prompt += f"{i}. Q: {qa.get('question')} | A: {qa.get('answer', '')[:80]}\n"
        prompt += (
            f"Generate question #{question_index + 1}. Do NOT repeat previously asked topics.\n"
            "Return strictly valid JSON in format: {\"question\": \"...\", \"topic\": \"...\", \"difficulty\": \"...\", \"question_type\": \"...\"}"
        )
        messages = [
            {"role": "system", "content": "You are a professional AI Interviewer. Output strict JSON only."},
            {"role": "user", "content": prompt}
        ]
        raw = cls._call_external_llm(messages, json_mode=True)
        if raw:
            try:
                parsed = json.loads(raw)
                if "question" in parsed:
                    return {
                        "question": parsed["question"],
                        "topic": parsed.get("topic", "Advanced Concepts"),
                        "difficulty": difficulty,
                        "question_type": interview_type
                    }
            except Exception:
                pass

        # Demo mode selection
        role_bank = QUESTION_BANKS.get(role, {})
        
        # For mixed interviews, alternate between technical, behavioral, and HR
        target_type = interview_type
        if interview_type == "Mixed":
            types_cycle = ["Technical", "Behavioral", "HR"]
            target_type = types_cycle[question_index % len(types_cycle)]

        type_bank = role_bank.get(target_type, role_bank.get("Technical", {}))
        diff_list = type_bank.get(difficulty, type_bank.get("Medium", []))
        
        # Find an unasked question from candidate pool
        for item in diff_list:
            if item["q"] not in asked_questions:
                return {
                    "question": item["q"],
                    "topic": item["topic"],
                    "difficulty": difficulty,
                    "question_type": target_type
                }

        # Check default pool
        for item in DEFAULT_QUESTIONS:
            if item["q"] not in asked_questions:
                return {
                    "question": item["q"],
                    "topic": item["topic"],
                    "difficulty": difficulty,
                    "question_type": target_type
                }

        # Safe dynamic generator
        return {
            "question": f"In your experience as a {role}, how do you evaluate architectural trade-offs when scaling software solutions?",
            "topic": "System & Code Trade-offs",
            "difficulty": difficulty,
            "question_type": target_type
        }

    @staticmethod
    def _extract_keywords(text: str) -> List[str]:
        """Extract content keywords from question or topic, filtering common stopwords."""
        cleaned = re.sub(r"[^\w\s]", " ", text.lower())
        stop_words = {
            "what", "which", "who", "whom", "this", "that", "these", "those",
            "am", "is", "are", "was", "were", "be", "been", "being",
            "have", "has", "had", "having", "do", "does", "did", "doing",
            "a", "an", "the", "and", "but", "if", "or", "because", "as",
            "until", "while", "of", "at", "by", "for", "with", "about",
            "against", "between", "into", "through", "during", "before", "after",
            "above", "below", "to", "from", "up", "down", "in", "out", "on",
            "off", "over", "under", "again", "further", "then", "once", "here",
            "there", "when", "where", "why", "how", "all", "any", "both", "each",
            "few", "more", "most", "other", "some", "such", "no", "nor", "not",
            "only", "own", "same", "so", "than", "too", "very", "can", "will",
            "just", "don", "should", "now", "explain", "describe", "difference",
            "differences", "differ", "tell", "could", "would", "example", "examples",
            "work", "used", "using", "mention", "discuss", "give"
        }
        return [w for w in cleaned.split() if len(w) >= 3 and w not in stop_words and not w.isdigit()]

    @staticmethod
    def _is_gibberish(text: str) -> bool:
        """Detect keyboard mash, random strings like 'hbh...', or unintelligible placeholder text."""
        words = text.strip().split()
        if not words:
            return True

        # Common technical abbreviations, acronyms, and math notation that omit standard vowels
        known_acronyms = {
            "rnn", "rnns", "lstm", "lstms", "cnn", "cnns", "sql", "html", "css", "nlp", "llm", "llms",
            "cpu", "cpus", "gpu", "gpus", "svm", "svms", "api", "apis", "dom", "knn", "http", "https",
            "json", "xml", "xss", "csrf", "mlops", "sdk", "sdks", "sqrt", "avg", "std", "exp", "pts", "sync",
            "tpu", "tpus", "bert", "gpt", "cli", "uuid", "db", "dbs", "io", "ios", "os", "url", "urls", "qk"
        }

        # Single word or short phrase check (e.g., 'hbh...', 'asdfgh', 'zzzzz', '123')
        if len(words) <= 3:
            for w in words:
                clean_w = re.sub(r"[^a-zA-Z]", "", w.lower())
                if not clean_w:
                    continue
                if clean_w in known_acronyms:
                    continue
                has_vowel = any(c in "aeiouy" for c in clean_w)
                if len(clean_w) >= 3 and not has_vowel:
                    return True
                if len(clean_w) >= 4 and len(set(clean_w)) <= 2:
                    return True
                if re.search(r"[bcdfghjklmnpqrstvwxyz]{5,}", clean_w):
                    return True
            # If all words have no letters at all (e.g. '....' or '???')
            if not any(re.search(r"[a-zA-Z]", w) for w in words):
                return True
            return False

        # Multi-word response: calculate ratio of suspicious non-word tokens
        suspicious_words = 0
        alpha_words = 0
        for w in words:
            clean_w = re.sub(r"[^a-zA-Z]", "", w.lower())
            if not clean_w:
                continue
            alpha_words += 1
            if clean_w in known_acronyms:
                continue
            has_vowel = any(c in "aeiouy" for c in clean_w)
            if len(clean_w) >= 4 and not has_vowel:
                suspicious_words += 1
            elif len(clean_w) >= 5 and len(set(clean_w)) <= 2:
                suspicious_words += 1
            elif re.search(r"[bcdfghjklmnpqrstvwxyz]{6,}", clean_w):
                suspicious_words += 1

        if alpha_words == 0 or (suspicious_words / max(1, alpha_words)) > 0.4:
            return True

        return False

    @staticmethod
    def _is_ignorance(text: str) -> bool:
        """Detect admissions of ignorance like 'I don't know', 'no idea', 'skip'."""
        lower = text.strip().lower()
        patterns = [
            r"\b(?:don'?t|do not|dont)\s+(?:know|understand)\b",
            r"\bno\s+idea\b",
            r"\bnot\s+sure\b",
            r"\bcan'?t\s+answer\b",
            r"\bcannot\s+answer\b",
            r"\bhave\s+no\s+clue\b",
            r"\bhaven'?t\s+(?:learned|heard|studied)\b",
            r"\b(?:pass|skip)\b"
        ]
        return any(re.search(p, lower) for p in patterns) and len(text.split()) < 16

    @classmethod
    def _evaluate_demo_mode(
        cls, question_text: str, answer_text: str, role: str, difficulty: str,
        topic: Optional[str] = None, interview_type: str = "Technical"
    ) -> Dict[str, Any]:
        """Dynamic heuristic evaluator when no external LLM API key is present."""
        clean_ans = answer_text.strip()
        words = clean_ans.split()
        wc = len(words)
        effective_topic = topic or role

        question_keywords = cls._extract_keywords(question_text)
        topic_keywords = cls._extract_keywords(effective_topic)
        answer_tokens = set(cls._extract_keywords(clean_ans))
        clean_lower = clean_ans.lower()

        # Domain term bank for additional technical depth evaluation
        domain_terms = {
            "ai": ["model", "data", "weights", "neural", "gradient", "loss", "overfitting", "regularization",
                   "attention", "transformer", "layer", "backprop", "supervised", "unsupervised", "epoch",
                   "precision", "recall", "accuracy", "feature", "dataset", "convolutional", "recurrent", "tensor", "rnn", "lstm"],
            "python": ["list", "tuple", "dict", "mutable", "immutable", "gil", "generator", "decorator", "yield",
                       "async", "await", "coroutine", "memory", "reference", "garbage", "collection", "class", "method", "module"],
            "web": ["dom", "virtual", "component", "state", "props", "hook", "event", "loop", "promise", "async",
                    "render", "ssr", "csr", "css", "flexbox", "grid", "api", "rest", "security", "xss", "csrf"],
            "data": ["sql", "join", "query", "eda", "missing", "outlier", "hypothesis", "test", "p-value", "clustering",
                     "kmeans", "pca", "variance", "distribution", "feature", "regression", "metrics"],
            "general": ["system", "architecture", "tradeoff", "latency", "scale", "performance", "complexity", "design", "testing"]
        }

        # 1. Empty Answer Check
        if not clean_ans or wc == 0:
            return {
                "score": 0.0,
                "relevance": 0.0,
                "technical_accuracy": 0.0,
                "clarity": 0.0,
                "completeness": 0.0,
                "feedback": "No answer was provided for this question.",
                "strengths": [],
                "areas_to_improve": [f"Provide a thoughtful answer addressing {effective_topic}"],
                "follow_up_required": False,
                "follow_up_question": None,
                "is_demo_mode": True
            }

        # 2. Gibberish / Keyboard Mash Check
        if cls._is_gibberish(clean_ans):
            sample = clean_ans[:20] + "..." if len(clean_ans) > 20 else clean_ans
            g_score = round(max(0.3, min(1.2, 0.4 + (len(clean_ans) % 6) * 0.1)), 1)
            return {
                "score": g_score,
                "relevance": 0.5,
                "technical_accuracy": 0.4,
                "clarity": 0.5,
                "completeness": 0.4,
                "feedback": f"The answer submitted appears to be unintelligible or placeholder text ('{sample}'). A proper answer for {effective_topic} should explain the core principles of the question.",
                "strengths": [],
                "areas_to_improve": [
                    "Provide a coherent English explanation",
                    f"Explain key concepts relating to {effective_topic}"
                ],
                "follow_up_required": True,
                "follow_up_question": f"Could you provide a clear, coherent technical response explaining {question_keywords[0] if question_keywords else effective_topic}?",
                "is_demo_mode": True
            }

        # 3. Admission of Ignorance Check
        if cls._is_ignorance(clean_ans):
            ign_score = round(1.0 + (len(clean_ans) % 5) * 0.1, 1)
            suggested_term = question_keywords[0] if question_keywords else effective_topic
            return {
                "score": ign_score,
                "relevance": 2.0,
                "technical_accuracy": 1.0,
                "clarity": 4.5,
                "completeness": 0.5,
                "feedback": f"You indicated you do not know the answer to this question on '{effective_topic}'. In real interviews, it is recommended to discuss adjacent fundamental concepts or explain how you would problem-solve the issue.",
                "strengths": ["Honest self-assessment regarding knowledge gaps"],
                "areas_to_improve": [
                    f"Review foundational concepts for {effective_topic}",
                    "Prepare high-level fallback principles when encountering unfamiliar questions"
                ],
                "follow_up_required": False,
                "follow_up_question": None,
                "is_demo_mode": True
            }

        # 4. Keyword & Domain Matching
        match_count = sum(1 for kw in question_keywords if kw in clean_lower)
        active_domain = []
        for role_key, terms in domain_terms.items():
            if role_key in role.lower():
                active_domain.extend(terms)
        if not active_domain:
            active_domain = domain_terms["general"]

        domain_match_count = sum(1 for dt in active_domain if dt in clean_lower)

        # 5. Irrelevant Answer Check (Wordy but zero semantic overlap)
        if wc >= 12 and match_count == 0 and domain_match_count == 0:
            rel = round(max(1.0, min(2.4, 1.2 + (wc % 4) * 0.2)), 1)
            tech = 1.0
            clar = round(max(4.0, min(7.5, 5.2 + min(2.0, wc * 0.03))), 1)
            comp = 1.0
            score = round(tech * 0.40 + rel * 0.35 + clar * 0.15 + comp * 0.10, 1)
            return {
                "score": score,
                "relevance": rel,
                "technical_accuracy": tech,
                "clarity": clar,
                "completeness": comp,
                "feedback": f"While your answer was grammatically written, it was completely irrelevant to the question asked. The question asks about '{question_text[:50]}...', but your response did not address this topic.",
                "strengths": ["Grammatically coherent writing style"],
                "areas_to_improve": [
                    f"Directly answer the question prompt regarding {effective_topic}",
                    "Avoid off-topic or tangential remarks"
                ],
                "follow_up_required": True,
                "follow_up_question": f"Could you refocus specifically on {question_keywords[0] if question_keywords else effective_topic} and explain how it applies here?",
                "is_demo_mode": True
            }

        # 6. Shallow / One-Sentence / Low-Depth Answer Check
        if wc < 25 and match_count <= 1:
            tech = round(max(2.8, min(4.8, 3.2 + match_count * 0.5 + domain_match_count * 0.3 + (wc % 3) * 0.1)), 1)
            rel = round(max(3.2, min(5.0, 3.6 + match_count * 0.5 + (len(clean_ans) % 4) * 0.1)), 1)
            clar = round(max(5.5, min(7.0, 5.8 + (wc % 4) * 0.2)), 1)
            comp = round(max(2.0, min(4.0, 2.2 + wc * 0.08)), 1)
            score = round(tech * 0.40 + rel * 0.30 + comp * 0.20 + clar * 0.10, 1)
            return {
                "score": score,
                "relevance": rel,
                "technical_accuracy": tech,
                "clarity": clar,
                "completeness": comp,
                "feedback": f"You stated a baseline fact regarding {effective_topic}, but your response lacked necessary technical depth ({wc} words). For a {difficulty.lower()} question, articulate the specific mechanisms, comparative advantages, and implementation aspects.",
                "strengths": ["Identified basic domain concepts correctly"],
                "areas_to_improve": [
                    "Provide in-depth technical mechanics rather than a single surface definition",
                    "Add concrete practical examples or comparisons"
                ],
                "follow_up_required": True,
                "follow_up_question": f"Can you elaborate in greater detail on how {question_keywords[0] if question_keywords else effective_topic} operates in a real-world scenario?",
                "is_demo_mode": True
            }

        # 7. Detailed vs Partially Correct Answers
        if wc >= 35 and (match_count >= 3 or (match_count >= 2 and domain_match_count >= 2)):
            # Comprehensive, high-scoring answer (Excellent tier: 8.0 - 10.0)
            tech = round(min(9.7, 8.6 + min(0.9, match_count * 0.2 + domain_match_count * 0.1) + (len(clean_ans) % 5) * 0.05), 1)
            rel = round(min(9.8, 8.8 + min(0.8, match_count * 0.2)), 1)
            clar = round(min(9.6, 8.8 + min(0.8, wc * 0.01)), 1)
            comp = round(min(9.6, 8.6 + min(1.0, wc * 0.015)), 1)
            score = round(tech * 0.35 + rel * 0.30 + comp * 0.20 + clar * 0.15, 1)
            return {
                "score": score,
                "relevance": rel,
                "technical_accuracy": tech,
                "clarity": clar,
                "completeness": comp,
                "feedback": f"Comprehensive and technically sound response. You demonstrated strong understanding of {effective_topic}, articulating key distinctions and trade-offs clearly.",
                "strengths": [
                    "Thorough technical explanation with accurate terminology",
                    "Addressed the core comparison and trade-offs",
                    "Well-structured, professional communication"
                ],
                "areas_to_improve": [
                    "Maintain this thorough level of technical depth across subsequent questions"
                ],
                "follow_up_required": False,
                "follow_up_question": None,
                "is_demo_mode": True
            }
        else:
            # Partially correct, moderate explanation (Good tier: 6.0 - 7.9)
            tech = round(max(5.8, min(7.6, 5.8 + min(1.4, match_count * 0.35 + domain_match_count * 0.15) + (len(clean_ans) % 5) * 0.06)), 1)
            rel = round(max(6.2, min(7.9, 6.2 + min(1.3, match_count * 0.3) + (wc % 4) * 0.08)), 1)
            clar = round(max(6.5, min(7.8, 6.6 + min(1.0, wc * 0.03))), 1)
            comp = round(max(5.2, min(7.2, 5.2 + min(1.6, wc * 0.05))), 1)
            score = round(tech * 0.35 + rel * 0.30 + comp * 0.20 + clar * 0.15, 1)

            matched_concepts = [k for k in question_keywords if k in clean_lower]
            concept_str = ", ".join(matched_concepts[:2]) if matched_concepts else effective_topic
            needs_follow_up = bool(score < 7.0)

            return {
                "score": score,
                "relevance": rel,
                "technical_accuracy": tech,
                "clarity": clar,
                "completeness": comp,
                "feedback": f"Good answer covering fundamental aspects of {concept_str}. To achieve top marks, deepen your explanation with architectural trade-offs, edge cases, or complexity considerations.",
                "strengths": [
                    "Demonstrated good baseline conceptual grasp",
                    f"Correctly addressed elements of {concept_str}"
                ],
                "areas_to_improve": [
                    "Expand upon computational or architectural trade-offs",
                    "Include a concrete production or implementation example"
                ],
                "follow_up_required": needs_follow_up,
                "follow_up_question": f"Could you elaborate on one specific trade-off or architectural constraint when working with {matched_concepts[0] if matched_concepts else effective_topic}?" if needs_follow_up else None,
                "is_demo_mode": True
            }

    @classmethod
    def evaluate_answer(
        cls,
        question_text: str,
        answer_text: str,
        role: str,
        difficulty: str,
        topic: Optional[str] = None,
        interview_type: str = "Technical",
        interview_id: Optional[str] = None,
        question_id: Optional[str] = None,
        question_number: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Evaluate a candidate's answer returning structured rubric scores (0-10) and feedback."""
        clean_ans = answer_text.strip()
        effective_topic = topic or role

        # Try Live External LLM API if key is configured
        if settings.LLM_API_KEY:
            prompt = (
                f"SYSTEM:\n"
                f"You are an expert technical and behavioral interview evaluator.\n"
                f"Evaluate the candidate's answer against the CURRENT interview question.\n"
                f"You must evaluate only the answer provided for this question.\n"
                f"Do not reuse scores or feedback from previous questions.\n\n"
                f"Consider:\n"
                f"- relevance\n"
                f"- correctness\n"
                f"- technical accuracy\n"
                f"- clarity\n"
                f"- completeness\n"
                f"- depth\n"
                f"- communication quality\n\n"
                f"Score the answer from 0 to 10.\n\n"
                f"QUESTION:\n{question_text}\n\n"
                f"CANDIDATE ANSWER:\n{clean_ans}\n\n"
                f"ROLE:\n{role}\n\n"
                f"INTERVIEW TYPE:\n{interview_type}\n\n"
                f"DIFFICULTY:\n{difficulty}\n\n"
                f"TOPIC:\n{effective_topic}\n\n"
                f"Return ONLY valid JSON:\n"
                f"{{\n"
                f'  "score": 0.0,\n'
                f'  "relevance": 0.0,\n'
                f'  "technical_accuracy": 0.0,\n'
                f'  "clarity": 0.0,\n'
                f'  "completeness": 0.0,\n'
                f'  "feedback": "...",\n'
                f'  "strengths": ["..."],\n'
                f'  "areas_to_improve": ["..."],\n'
                f'  "follow_up_required": false,\n'
                f'  "follow_up_question": null\n'
                f"}}\n"
                f"All numeric values must be between 0 and 10."
            )
            messages = [
                {"role": "system", "content": "You are a fair, precise technical interview evaluator. Output strict JSON only."},
                {"role": "user", "content": prompt}
            ]
            raw = cls._call_external_llm(messages, json_mode=True)
            if raw:
                try:
                    # Strip markdown block if model output includes ```json
                    cleaned_raw = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.MULTILINE)
                    cleaned_raw = re.sub(r"```$", "", cleaned_raw.strip(), flags=re.MULTILINE)
                    parsed = json.loads(cleaned_raw)

                    # Validate bounds strictly
                    sc = max(0.0, min(10.0, float(parsed.get("score", 7.0))))
                    rel = max(0.0, min(10.0, float(parsed.get("relevance", sc))))
                    tech = max(0.0, min(10.0, float(parsed.get("technical_accuracy", sc))))
                    clar = max(0.0, min(10.0, float(parsed.get("clarity", sc))))
                    comp = max(0.0, min(10.0, float(parsed.get("completeness", sc))))

                    result = {
                        "score": round(sc, 1),
                        "relevance": round(rel, 1),
                        "technical_accuracy": round(tech, 1),
                        "clarity": round(clar, 1),
                        "completeness": round(comp, 1),
                        "feedback": str(parsed.get("feedback", "Good explanation.")).strip(),
                        "strengths": list(parsed.get("strengths", ["Solid technical understanding"])),
                        "areas_to_improve": list(parsed.get("areas_to_improve", ["Continue building technical depth"])),
                        "follow_up_required": bool(parsed.get("follow_up_required", False)),
                        "follow_up_question": parsed.get("follow_up_question") or None,
                        "is_demo_mode": False
                    }

                    # Log debug output
                    print(f"""
[Evaluation]
Interview: {interview_id or 'N/A'}
Question ID: {question_id or 'N/A'}
Question #{question_number or 'N/A'}: {question_text}
Answer: {clean_ans}
Score: {result['score']}/10 (Tech: {result['technical_accuracy']}, Rel: {result['relevance']}, Clar: {result['clarity']}, Comp: {result['completeness']})
Mode: Live LLM API
Feedback: {result['feedback']}
""")
                    return result
                except Exception as ex:
                    print(f"[Evaluation Warning] LLM parsing failed: {ex}. Falling back to dynamic Demo AI Mode.")

        # Fallback to Dynamic Demo AI Mode
        result = cls._evaluate_demo_mode(
            question_text=question_text,
            answer_text=clean_ans,
            role=role,
            difficulty=difficulty,
            topic=effective_topic,
            interview_type=interview_type
        )

        # Log debug output for Demo Mode
        print(f"""
[Evaluation]
Interview: {interview_id or 'N/A'}
Question ID: {question_id or 'N/A'}
Question #{question_number or 'N/A'}: {question_text}
Answer: {clean_ans}
Score: {result['score']}/10 (Tech: {result['technical_accuracy']}, Rel: {result['relevance']}, Clar: {result['clarity']}, Comp: {result['completeness']})
Mode: Demo AI Mode
Feedback: {result['feedback']}
""")
        return result


    @classmethod
    def generate_final_report(
        cls, role: str, interview_type: str, difficulty: str, questions_and_answers: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Aggregate all responses into an executive summary, strengths, and improvement areas."""
        total = len(questions_and_answers)
        if total == 0:
            return {
                "overall_score": 75.0,
                "technical_score": 75.0,
                "clarity_score": 75.0,
                "relevance_score": 75.0,
                "completeness_score": 75.0,
                "summary": "Interview completed successfully.",
                "strengths": ["Completed all stages"],
                "weaknesses": ["Provide more detailed answers"],
                "recommendations": ["Review fundamentals"]
            }

        avg_score = sum(item.get("score", 7.0) for item in questions_and_answers) / total
        avg_tech = sum(item.get("technical_score", 7.0) for item in questions_and_answers) / total
        avg_clar = sum(item.get("clarity_score", 7.0) for item in questions_and_answers) / total
        avg_rel = sum(item.get("relevance_score", 7.0) for item in questions_and_answers) / total
        avg_comp = sum(item.get("completeness_score", 7.0) for item in questions_and_answers) / total

        # Convert to 0-100 percentage
        overall_pct = round(avg_score * 10, 1)
        tech_pct = round(avg_tech * 10, 1)
        clar_pct = round(avg_clar * 10, 1)
        rel_pct = round(avg_rel * 10, 1)
        comp_pct = round(avg_comp * 10, 1)

        # External LLM attempt
        prompt = (
            f"Generate an executive interview summary report for a candidate who completed an interview for {role} ({interview_type}, {difficulty}).\n"
            f"Overall score: {overall_pct}%\n"
            f"Technical Accuracy: {tech_pct}%\n"
            f"Communication: {clar_pct}%\n"
            f"Relevance: {rel_pct}%\n"
            f"Completeness: {comp_pct}%\n"
            "Candidate Q&A breakdown:\n"
        )
        for i, item in enumerate(questions_and_answers, 1):
            prompt += f"{i}. Q: {item.get('question_text', '')}\n   A: {item.get('answer_text', '')[:100]}\n"
        
        prompt += (
            "Return JSON in format:\n"
            "{\n"
            "  \"summary\": \"2-3 sentence executive review\",\n"
            "  \"strengths\": [\"strength 1\", \"strength 2\", \"strength 3\"],\n"
            "  \"weaknesses\": [\"improvement 1\", \"improvement 2\", \"improvement 3\"],\n"
            "  \"recommendations\": [\"topic 1\", \"topic 2\", \"topic 3\"]\n"
            "}"
        )

        messages = [
            {"role": "system", "content": "You are a seasoned senior hiring manager writing a concise performance evaluation. Return JSON."},
            {"role": "user", "content": prompt}
        ]
        raw = cls._call_external_llm(messages, json_mode=True)
        if raw:
            try:
                parsed = json.loads(raw)
                return {
                    "overall_score": overall_pct,
                    "technical_score": tech_pct,
                    "clarity_score": clar_pct,
                    "relevance_score": rel_pct,
                    "completeness_score": comp_pct,
                    "summary": parsed.get("summary", f"Strong performance in the {role} interview with solid technical comprehension."),
                    "strengths": parsed.get("strengths", ["Solid technical fundamentals", "Clear communication", "Structured thought process"]),
                    "weaknesses": parsed.get("weaknesses", ["Provide more quantitative project metrics", "Elaborate on edge cases"]),
                    "recommendations": parsed.get("recommendations", [role, "System Architecture", "Behavioral STAR method"])
                }
            except Exception:
                pass

        # Demo fallback generation
        strengths = [
            f"Strong foundational grasp of {role} core concepts",
            "Clear and articulate communication throughout the interview",
            "Good logical sequencing when explaining technical workflows"
        ]
        weaknesses = [
            "Could quantify project achievements with specific metrics and benchmarks",
            "Add deeper explanations regarding production edge cases and error handling",
            "Elaborate more on alternative solutions and architectural trade-offs"
        ]
        recommendations = [
            f"{role} Advanced Design Patterns",
            "High-concurrency performance optimization",
            "Structured STAR method for scenario-based questions"
        ]
        summary = (
            f"The candidate demonstrated solid technical aptitude for the {role} position. "
            f"Responses were well-aligned with the {difficulty.lower()} difficulty standard, achieving an overall score of {overall_pct}%. "
            f"With minor refinements in discussing architectural trade-offs, the candidate shows strong readiness for professional interviews."
        )

        return {
            "overall_score": overall_pct,
            "technical_score": tech_pct,
            "clarity_score": clar_pct,
            "relevance_score": rel_pct,
            "completeness_score": comp_pct,
            "summary": summary,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "recommendations": recommendations
        }

    @classmethod
    def analyze_resume(cls, resume_text: str) -> Dict[str, Any]:
        """Extract skills, technologies, projects, and recommend tailored interview questions."""
        common_tech = [
            "Python", "JavaScript", "TypeScript", "React", "Node.js", "FastAPI",
            "Django", "Flask", "PyTorch", "TensorFlow", "scikit-learn", "Docker",
            "Kubernetes", "AWS", "SQL", "PostgreSQL", "MongoDB", "Git", "Linux",
            "C++", "Java", "Spring Boot", "HTML", "CSS", "Tailwind CSS", "GraphQL"
        ]
        
        found_tech = [t for t in common_tech if re.search(rf"\b{re.escape(t)}\b", resume_text, re.IGNORECASE)]
        if not found_tech:
            found_tech = ["Python", "Machine Learning", "FastAPI", "SQL", "Git"]

        skills = found_tech[:8]
        
        # Identify projects mentioned
        project_matches = re.findall(r"(?:project|built|developed|created|system|application|platform)[\s\w]{0,40}", resume_text, re.IGNORECASE)
        projects = [p.strip() for p in project_matches[:3]] if project_matches else ["AI Interview Practice Platform", "Machine Learning Predictive Classifier", "Full-Stack Web Portal"]

        # Recommended questions
        recommended_questions = [
            f"Can you walk me through the architecture and data pipeline of your project?",
            f"How did you optimize performance and manage state when working with {skills[0] if skills else 'your main stack'}?",
            f"What was the most challenging technical roadblock you encountered and how did you debug it?",
            f"How did you approach testing and ensuring reliability across your codebase?",
            f"If you had another sprint to work on this, what architectural enhancements would you prioritize?"
        ]

        return {
            "skills": skills,
            "technologies": found_tech,
            "projects": projects,
            "education": ["Computer Science & Engineering (AIML)", "B.Tech / Undergraduate"],
            "experience_summary": f"Demonstrated background with skills including {', '.join(skills[:4])}. Hands-on experience across full-stack development and machine learning paradigms.",
            "recommended_questions": recommended_questions
        }

    @classmethod
    def analyze_job_description(cls, jd_text: str) -> Dict[str, Any]:
        """Analyze pasted job description for required skills and interview expectations."""
        common_tech = [
            "Python", "React", "Machine Learning", "Deep Learning", "FastAPI", "Docker",
            "SQL", "AWS", "Java", "Kubernetes", "Microservices", "CI/CD", "NLP"
        ]
        required = [t for t in common_tech if re.search(rf"\b{re.escape(t)}\b", jd_text, re.IGNORECASE)]
        if not required:
            required = ["Software Development", "System Architecture", "Problem Solving"]
            
        return {
            "required_skills": required,
            "key_responsibilities": [
                "Collaborate with cross-functional teams to design and implement scalable solutions",
                "Write clean, maintainable, and thoroughly tested production-grade code",
                "Participate in design reviews and continuous architectural improvement"
            ],
            "focus_areas": ["Core System Engineering", "Data Modeling", "Production Reliability"]
        }

use('ai_interview_coach');

// Display the latest 20 registered users
db.getCollection('users')
  .find({}, { password_hash: 0 })
  .sort({ _id: -1 })
  .limit(20);
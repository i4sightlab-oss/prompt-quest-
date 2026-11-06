export const missions = [
  {
    id: "role",
    key: "ROLE",
    title: "Who is the AI?",
    icon: "🧑‍🏫",
    prompt: "Make a lesson about animals.",
    answer: "weak",
    explanation: "The prompt does not give the AI a useful role. A role such as 'experienced primary English teacher' helps establish the perspective and expertise expected.",
    fix: "Act as an experienced primary English teacher..."
  },
  {
    id: "context",
    key: "CONTEXT",
    title: "Give the AI a classroom",
    icon: "🏫",
    prompt: "You teach Grade 3 in a rural Egyptian primary school. Your learners are A1 beginners, have limited English exposure outside school, and enjoy movement and familiar local examples. Plan a 35-minute lesson about farm animals.",
    answer: "strong",
    explanation: "This prompt gives relevant learner, level, location, topic and lesson-time context. The AI can now create something more realistic and suitable.",
    fix: "Keep the learner profile, level, setting, topic and time."
  },
  {
    id: "task",
    key: "TASK",
    title: "Give a clear mission",
    icon: "🎯",
    prompt: "Give me some questions about water.",
    answer: "weak",
    explanation: "The task is too broad. The AI does not know the learners' age, purpose, question types or number of questions.",
    fix: "Write 8 Grade 6 comprehension questions about water conservation: 3 multiple-choice, 3 true/false and 2 open-ended."
  },
  {
    id: "clarity",
    key: "CLARITY",
    title: "Make it crystal clear",
    icon: "💎",
    prompt: "Act as an inclusive English teacher. For a Grade 6 class learning the present simple, create three differentiated speaking activities: one with sentence frames and pictures described in words, one at the expected level, and one challenge task. Give clear pupil instructions and one success criterion for each activity.",
    answer: "strong",
    explanation: "The task is specific and actionable. It names the topic, learner group, differentiation levels, expected materials and success criteria.",
    fix: "Name the learner group, language focus, number/type of activities and what success looks like."
  },
  {
    id: "constraints",
    key: "CONSTRAINTS",
    title: "Set the boundaries",
    icon: "🧭",
    prompt: "Create a beautiful, wonderful, exciting, amazing English grammar lesson with lots of fantastic activities for everyone. Make it perfect and very creative.",
    answer: "weak",
    explanation: "Many adjectives do not create useful constraints. The AI needs practical boundaries such as lesson duration, class size, available resources and language level.",
    fix: "Add realistic limits: 35 minutes, 40 pupils, a board and paper only, A1 level."
  },
  {
    id: "output",
    key: "OUTPUT",
    title: "Choose the final shape",
    icon: "📦",
    prompt: "Act as an assessment specialist. Design a 10-item formative assessment for Grade 5 A1 learners on the past simple. Include 3 multiple-choice items, 2 gap-fills, 2 sentence-ordering items, 2 error-correction items and 1 short personal response. Use simple instructions, provide an answer key, and format it as a printable table.",
    answer: "strong",
    explanation: "The prompt specifies the output format, item count, question types, level, language focus and answer key.",
    fix: "Tell the AI exactly what the final response should look like: table, checklist, dialogue, lesson plan, rubric, etc."
  }
];

export const finalMission = {
  weak: "Create activities for my pupils.",
  task: "Rewrite this prompt so an AI tool can produce useful, classroom-ready activities. Include a role, learner context, a clear task, practical constraints and the format you want."
};
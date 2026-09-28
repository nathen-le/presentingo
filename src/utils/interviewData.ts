import { InterviewCategory } from '../types';

export interface QuestionCategoryData {
  category: InterviewCategory;
  description: string;
  iconName: string;
  questions: string[];
}

export const INTERVIEW_CATEGORIES: QuestionCategoryData[] = [
  {
    category: 'General',
    description: 'Essential questions used across all types of interviews.',
    iconName: 'MessageSquare',
    questions: [
      'Tell me about yourself.',
      'Why are you interested in this opportunity?',
      'What are your greatest strengths and weaknesses?',
      'Where do you see yourself in 3 to 5 years?',
      'What motivates you to work hard and succeed?',
      'How do you handle stress and pressure?',
      'What sets you apart from other candidates?'
    ]
  },
  {
    category: 'College',
    description: 'Tailored for university and academic admissions interviews.',
    iconName: 'GraduationCap',
    questions: [
      'Why do you want to attend our institution?',
      'What academic subjects are you most passionate about and why?',
      'How will you contribute to our campus community outside the classroom?',
      'Describe a book or project that had a major influence on your thinking.',
      'What has been your most meaningful extracurricular activity?',
      'Tell me about a time you engaged in an academic debate or discussion.'
    ]
  },
  {
    category: 'Scholarship',
    description: 'Focused on financial awards, merit programs, and educational grants.',
    iconName: 'Award',
    questions: [
      'How will receiving this scholarship impact your academic and career goals?',
      'Tell me about a obstacle you overcame to achieve academic success.',
      'How have you demonstrated community service or civic involvement?',
      'What unique perspectives will you bring to this scholarship cohort?',
      'Describe your future vision and how this funding aligns with it.'
    ]
  },
  {
    category: 'Internship',
    description: 'Designed for high school and university students seeking initial work experience.',
    iconName: 'Briefcase',
    questions: [
      'Why are you pursuing an internship in this specific field?',
      'What relevant coursework or projects prepare you for this role?',
      'Tell me about a time you had to learn a new skill or software quickly.',
      'How do you prioritize tasks when managing multiple school or project deadlines?',
      'What do you hope to accomplish during this internship?'
    ]
  },
  {
    category: 'Job',
    description: 'Professional career questions focusing on skills and domain experience.',
    iconName: 'UserCheck',
    questions: [
      'Walk me through your resume and key achievements.',
      'Why do you want to work for our organization specifically?',
      'Describe a technical or complex problem you solved recently.',
      'How do you prefer to receive feedback from supervisors or managers?',
      'What work environment or team culture enables you to thrive?'
    ]
  },
  {
    category: 'Leadership',
    description: 'Assesses initiative, vision, team guidance, and influence.',
    iconName: 'Compass',
    questions: [
      'Describe a time you stepped up as a leader when non-one else did.',
      'How do you motivate team members who have differing opinions or low morale?',
      'Tell me about a decision you made that was unpopular and how you communicated it.',
      'How do you delegate tasks effectively when leading a group project?',
      'Describe your personal leadership style.'
    ]
  },
  {
    category: 'Behavioral',
    description: 'STAR-method questions focusing on past experiences and actions.',
    iconName: 'Activity',
    questions: [
      'Tell me about a challenge you faced and how you handled it.',
      'Describe a time you worked on a team with a difficult team member.',
      'Tell me about a time you made a mistake and what you learned from it.',
      'Describe a situation where you had to adapt quickly to sudden changes.',
      'Tell me about a time you went above and beyond what was expected.'
    ]
  },
  {
    category: 'Situational',
    description: 'Hypothetical scenarios testing problem-solving and decision making.',
    iconName: 'HelpCircle',
    questions: [
      'Imagine you are assigned a project with unclear requirements. What steps would you take?',
      'If you disagreed with your manager or professor on an approach, how would you handle it?',
      'What would you do if a key team member dropped out right before a deadline?',
      'How would you handle a situation where you noticed an error in a completed deliverable?',
      'If you were given two urgent high-priority assignments at the same time, how would you decide which to complete first?'
    ]
  }
];

export const IMPROMPTU_TOPICS: string[] = [
  'Should students have homework every night?',
  'Is artificial intelligence beneficial or harmful for high school education?',
  'Should schools replace traditional textbooks with digital devices completely?',
  'What is the single most important skill for a young person to learn today?',
  'Should social media access be restricted for teenagers under 16?',
  'Is failure a necessary step toward achieving success?',
  'Should high schools require mandatory volunteer community service hours?',
  'If you could solve one global challenge, what would it be and why?',
  'Is remote learning as effective as in-person classroom instruction?',
  'What role should arts and music play in a school curriculum?',
  'Should college education be tuition-free for all students?',
  'What makes a great mentor or role model?'
];

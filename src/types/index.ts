// Type definitions for Family Goals app

export interface Family {
  id: string
  name: string
  password_hash: string
  created_at: string
}

export interface Member {
  id: string
  family_id: string
  name: string
  pin: string
  avatar_color: string
  profile_photo_url?: string
  created_at: string
}

export interface Goal {
  id: string
  member_id: string
  type: 'water' | 'exercise' | 'custom' | 'assigned'
  title: string
  description?: string
  target_value?: number
  target_unit?: string
  assigned_by?: string
  assigned_by_name?: string
  assigned_by_color?: string
  is_custom: boolean
  frequency: 'daily' | 'weekly'
  due_time?: string
  reminder_enabled: boolean
  reminder_time?: string
  is_completed?: boolean
  completion_value?: number
  completion_notes?: string
  created_at: string
}

export interface GoalCompletion {
  id: string
  goal_id: string
  member_id: string
  date: string
  value?: number
  notes?: string
  completed_at: string
}

export interface WaterEntry {
  id: string
  member_id: string
  amount_ml: number
  date: string
  created_at: string
}

export interface ExerciseEntry {
  id: string
  member_id: string
  duration_minutes: number
  activity: string
  notes?: string
  date: string
  created_at: string
}

export interface CustomExercise {
  id: string
  family_id: string
  name: string
  icon?: string
  default_duration: number
  created_by?: string
  created_by_name?: string
  created_at: string
}

export interface Notification {
  id: string
  member_id: string
  type: 'reminder' | 'achievement' | 'assignment' | 'streak'
  title: string
  message?: string
  goal_id?: string
  goal_title?: string
  is_read: boolean
  created_at: string
}

export interface Photo {
  id: string
  family_id: string
  member_id?: string
  goal_id?: string
  type: 'profile' | 'goal' | 'background'
  url: string
  original_name?: string
  caption?: string
  created_at: string
}

export interface FamilySettings {
  id: string
  family_id: string
  theme: string
  background_type: 'gradient' | 'photo'
  background_value: string
  background_fit: 'cover' | 'contain' | 'fill'
  background_position: string
  background_blur: number
  background_overlay: number
  background_overlay_color: string
  background_contain_color: string
  accent_color: string
  updated_at: string
}

export interface DashboardMember extends Member {
  goals: Goal[]
  water_progress: { current: number; target: number }
  exercise_progress: { current: number; target: number }
  completed_count: number
  total_goals: number
  weekly_completed_count: number
  weekly_total_goals: number
}

export interface StatsData {
  period: string
  start_date: string
  end_date: string
  days: Array<{
    date: string
    completed: number
    total: number
    water: number
    exercise: number
  }>
  summary: {
    avg_completion: number
    perfect_days: number
    current_streak: number
    total_water: number
    total_exercise: number
  }
}


import Foundation

struct Family: Codable, Identifiable {
    let id: String
    let name: String
}

struct Member: Codable, Identifiable {
    let id: String
    let family_id: String
    let name: String
    let pin: String?
    let avatar_color: String
    let profile_photo_url: String?
    
    var avatarInitial: String {
        String(name.prefix(1)).uppercased()
    }
}

struct Goal: Codable, Identifiable {
    let id: String
    let member_id: String
    let type: String
    let title: String
    let description: String?
    let target_value: Double?
    let target_unit: String?
    let assigned_by: String?
    let assigned_by_name: String?
    let assigned_by_color: String?
    let is_custom: Bool
    let frequency: String
    let due_time: String?
    let reminder_enabled: Bool
    let reminder_time: String?
    var is_completed: Bool?
    let completion_value: Double?
    let completion_notes: String?
}

struct WaterEntry: Codable, Identifiable {
    let id: String
    let member_id: String
    let amount_ml: Double
    let date: String
}

struct ExerciseEntry: Codable, Identifiable {
    let id: String
    let member_id: String
    let duration_minutes: Int
    let activity: String?
    let notes: String?
    let date: String
}

struct StepsEntry: Codable, Identifiable {
    let id: String
    let member_id: String
    let steps: Int
    let date: String
    let source: String
    let created_at: String
}

struct DashboardMember: Codable, Identifiable {
    let id: String
    let name: String
    let avatar_color: String
    let profile_photo_url: String?
    let goals: [Goal]
    let water_progress: ProgressData
    let exercise_progress: ProgressData
    let steps_progress: ProgressData
    let completed_count: Int
    let total_goals: Int
    let weekly_completed_count: Int
    let weekly_total_goals: Int

    var avatarInitial: String {
        String(name.prefix(1)).uppercased()
    }
}

struct ProgressData: Codable {
    let current: Double
    let target: Double
    
    var percentage: Double {
        guard target > 0 else { return 0 }
        return min(1.0, current / target)
    }
}

struct LoginResponse: Codable {
    let token: String
    let family: Family
    let members: [Member]
}

struct PinResponse: Codable {
    let token: String
    let member: Member
}

struct WaterResponse: Codable {
    let entries: [WaterEntry]
    let total: Double
    let target: Double
    let unit: String?
}

struct ExerciseResponse: Codable {
    let entries: [ExerciseEntry]
    let total: Int
    let target: Int
}

struct StepsResponse: Codable {
    let entries: [StepsEntry]
    let total: Int
    let target: Int
    let unit: String?
}


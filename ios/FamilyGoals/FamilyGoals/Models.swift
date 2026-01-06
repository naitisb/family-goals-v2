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

    // Custom decoding to handle SQLite integer booleans (0/1)
    enum CodingKeys: String, CodingKey {
        case id, member_id, type, title, description, target_value, target_unit
        case assigned_by, assigned_by_name, assigned_by_color, is_custom
        case frequency, due_time, reminder_enabled, reminder_time
        case is_completed, completion_value, completion_notes
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        id = try container.decode(String.self, forKey: .id)
        member_id = try container.decode(String.self, forKey: .member_id)
        type = try container.decode(String.self, forKey: .type)
        title = try container.decode(String.self, forKey: .title)
        description = try container.decodeIfPresent(String.self, forKey: .description)
        target_value = try container.decodeIfPresent(Double.self, forKey: .target_value)
        target_unit = try container.decodeIfPresent(String.self, forKey: .target_unit)
        assigned_by = try container.decodeIfPresent(String.self, forKey: .assigned_by)
        assigned_by_name = try container.decodeIfPresent(String.self, forKey: .assigned_by_name)
        assigned_by_color = try container.decodeIfPresent(String.self, forKey: .assigned_by_color)

        // Decode is_custom as either Bool or Int
        if let boolValue = try? container.decode(Bool.self, forKey: .is_custom) {
            is_custom = boolValue
        } else if let intValue = try? container.decode(Int.self, forKey: .is_custom) {
            is_custom = intValue != 0
        } else {
            is_custom = false
        }

        frequency = try container.decode(String.self, forKey: .frequency)
        due_time = try container.decodeIfPresent(String.self, forKey: .due_time)

        // Decode reminder_enabled as either Bool or Int
        if let boolValue = try? container.decode(Bool.self, forKey: .reminder_enabled) {
            reminder_enabled = boolValue
        } else if let intValue = try? container.decode(Int.self, forKey: .reminder_enabled) {
            reminder_enabled = intValue != 0
        } else {
            reminder_enabled = false
        }

        reminder_time = try container.decodeIfPresent(String.self, forKey: .reminder_time)

        // Decode is_completed as either Bool or Int
        if let boolValue = try? container.decodeIfPresent(Bool.self, forKey: .is_completed) {
            is_completed = boolValue
        } else if let intValue = try? container.decodeIfPresent(Int.self, forKey: .is_completed) {
            is_completed = intValue != 0
        } else {
            is_completed = nil
        }

        completion_value = try container.decodeIfPresent(Double.self, forKey: .completion_value)
        completion_notes = try container.decodeIfPresent(String.self, forKey: .completion_notes)
    }
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

struct SimpleResponse: Codable {
    let success: Bool
    let id: String?
}

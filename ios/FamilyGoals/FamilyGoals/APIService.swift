import Foundation

enum APIError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case decodingError
    case serverError(String)
    case unauthorized
    
    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid URL"
        case .invalidResponse: return "Invalid response from server"
        case .decodingError: return "Failed to decode response"
        case .serverError(let message): return message
        case .unauthorized: return "Unauthorized"
        }
    }
}

class APIService {
    static let shared = APIService()
    
    // ⚠️ IMPORTANT: Update this URL after deploying to Vercel
    // For local development: "http://localhost:3000/api"
    // For production: "https://your-app.vercel.app/api"
    private var baseURL: String {
        UserDefaults.standard.string(forKey: "apiBaseURL") ?? "http://localhost:3000/api"
    }
    
    var token: String?
    
    private init() {
        token = UserDefaults.standard.string(forKey: "authToken")
    }
    
    func setBaseURL(_ url: String) {
        UserDefaults.standard.set(url, forKey: "apiBaseURL")
    }
    
    func setToken(_ token: String?) {
        self.token = token
        if let token = token {
            UserDefaults.standard.set(token, forKey: "authToken")
        } else {
            UserDefaults.standard.removeObject(forKey: "authToken")
        }
    }
    
    private func request<T: Decodable>(_ endpoint: String, method: String = "GET", body: [String: Any]? = nil) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        if httpResponse.statusCode == 401 {
            throw APIError.unauthorized
        }
        
        if httpResponse.statusCode >= 400 {
            if let errorResponse = try? JSONDecoder().decode([String: String].self, from: data),
               let errorMessage = errorResponse["error"] {
                throw APIError.serverError(errorMessage)
            }
            throw APIError.serverError("Request failed with status \(httpResponse.statusCode)")
        }
        
        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            print("Decoding error: \(error)")
            throw APIError.decodingError
        }
    }
    
    // Auth
    func login(familyName: String, password: String) async throws -> LoginResponse {
        return try await request("/auth/login", method: "POST", body: [
            "familyName": familyName,
            "password": password
        ])
    }
    
    func verifyPin(memberId: String, pin: String) async throws -> PinResponse {
        return try await request("/auth/verify-pin", method: "POST", body: [
            "memberId": memberId,
            "pin": pin
        ])
    }
    
    // Dashboard
    func getDashboard() async throws -> [DashboardMember] {
        return try await request("/dashboard")
    }
    
    // Members
    func getMembers() async throws -> [Member] {
        return try await request("/members")
    }
    
    // Water
    func getWater(memberId: String) async throws -> WaterResponse {
        return try await request("/water?memberId=\(memberId)")
    }
    
    func addWater(memberId: String, amountMl: Double) async throws -> [String: Any] {
        return try await request("/water", method: "POST", body: [
            "memberId": memberId,
            "amount_ml": amountMl
        ])
    }
    
    // Exercise
    func getExercise(memberId: String) async throws -> ExerciseResponse {
        return try await request("/exercise?memberId=\(memberId)")
    }
    
    func addExercise(memberId: String, durationMinutes: Int, activity: String, notes: String? = nil) async throws -> [String: Any] {
        var body: [String: Any] = [
            "memberId": memberId,
            "duration_minutes": durationMinutes,
            "activity": activity
        ]
        if let notes = notes {
            body["notes"] = notes
        }
        return try await request("/exercise", method: "POST", body: body)
    }

    // Steps
    func getSteps(memberId: String, date: String? = nil) async throws -> StepsResponse {
        var endpoint = "/steps?memberId=\(memberId)"
        if let date = date {
            endpoint += "&date=\(date)"
        }
        return try await request(endpoint)
    }

    func syncSteps(memberId: String, steps: Int, date: String, source: String = "healthkit") async throws -> [String: Any] {
        return try await request("/steps", method: "POST", body: [
            "memberId": memberId,
            "steps": steps,
            "date": date,
            "source": source
        ])
    }

    // Goals
    func completeGoal(goalId: String, memberId: String) async throws -> [String: Any] {
        return try await request("/goals/\(goalId)/complete", method: "POST", body: [
            "memberId": memberId
        ])
    }
}


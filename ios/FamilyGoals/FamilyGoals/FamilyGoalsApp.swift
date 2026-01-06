import SwiftUI

@main
struct FamilyGoalsApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var healthKitManager = HealthKitManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .environmentObject(healthKitManager)
                .task {
                    // Request HealthKit authorization when app launches
                    if HealthKitManager.isHealthKitAvailable() {
                        try? await healthKitManager.requestAuthorization()
                    }
                }
        }
    }
}

class AppState: ObservableObject {
    @Published var isLoggedIn = false
    @Published var family: Family?
    @Published var members: [Member] = []
    @Published var currentMember: Member?
    @Published var token: String?
    
    init() {
        // Check for existing token
        if let token = UserDefaults.standard.string(forKey: "authToken") {
            self.token = token
            APIService.shared.token = token
            // We'll verify the token when loading members
        }
    }
    
    func login(response: LoginResponse) {
        self.token = response.token
        self.family = response.family
        self.members = response.members
        self.isLoggedIn = true
        APIService.shared.setToken(response.token)
    }
    
    func setCurrentMember(_ member: Member, token: String) {
        self.currentMember = member
        self.token = token
        APIService.shared.setToken(token)
    }
    
    func logout() {
        self.currentMember = nil
    }
    
    func fullLogout() {
        self.isLoggedIn = false
        self.family = nil
        self.members = []
        self.currentMember = nil
        self.token = nil
        APIService.shared.setToken(nil)
    }
}



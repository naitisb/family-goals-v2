import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedMember: Member?
    @State private var showingPinEntry = false
    @State private var viewingMember: DashboardMember?
    
    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.06, green: 0.06, blue: 0.14),
                    Color(red: 0.1, green: 0.1, blue: 0.24),
                    Color(red: 0.06, green: 0.06, blue: 0.14)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            // Content
            if !appState.isLoggedIn {
                LoginView()
            } else if appState.currentMember == nil {
                if showingPinEntry, let member = selectedMember {
                    PinEntryView(member: member) {
                        showingPinEntry = false
                        selectedMember = nil
                    }
                } else {
                    MemberSelectView { member in
                        selectedMember = member
                        showingPinEntry = true
                    }
                }
            } else if let viewMember = viewingMember {
                MemberDetailView(member: viewMember) {
                    viewingMember = nil
                }
            } else {
                DashboardView { member in
                    viewingMember = member
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}

#Preview {
    ContentView()
        .environmentObject(AppState())
}



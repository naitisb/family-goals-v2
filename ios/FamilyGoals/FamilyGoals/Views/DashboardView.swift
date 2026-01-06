import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var healthKitManager: HealthKitManager
    let onViewMember: (DashboardMember) -> Void

    @State private var dashboard: [DashboardMember] = []
    @State private var isLoading = true
    @State private var isSyncingSteps = false
    @State private var isSyncingWater = false
    @State private var syncErrorMessage: String?
    @State private var showSyncSuccess = false
    
    var currentMemberData: DashboardMember? {
        dashboard.first { $0.id == appState.currentMember?.id }
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                HStack {
                    if let member = appState.currentMember {
                        Circle()
                            .fill(Color(hex: member.avatar_color))
                            .frame(width: 40, height: 40)
                            .overlay(
                                Text(member.avatarInitial)
                                    .font(.headline)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                            )
                        
                        VStack(alignment: .leading) {
                            Text(member.name)
                                .font(.headline)
                                .foregroundColor(.white)
                            
                            Text(Date().formatted(date: .abbreviated, time: .omitted))
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.5))
                        }
                    }
                    
                    Spacer()
                    
                    Button(action: { appState.logout() }) {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                            .foregroundColor(.white.opacity(0.6))
                    }
                }
                .padding(.horizontal)

                // Sync Status Messages
                if let errorMessage = syncErrorMessage {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.red)
                        Text(errorMessage)
                            .font(.caption)
                            .foregroundColor(.white)
                    }
                    .padding()
                    .background(Color.red.opacity(0.2))
                    .cornerRadius(12)
                    .padding(.horizontal)
                }

                if showSyncSuccess {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                        Text("Steps synced successfully!")
                            .font(.caption)
                            .foregroundColor(.white)
                    }
                    .padding()
                    .background(Color.green.opacity(0.2))
                    .cornerRadius(12)
                    .padding(.horizontal)
                }

                if isLoading {
                    ProgressView()
                        .tint(.white)
                        .frame(maxWidth: .infinity, minHeight: 200)
                } else {
                    // Today's Progress
                    if let memberData = currentMemberData {
                        Button(action: { onViewMember(memberData) }) {
                            VStack(spacing: 16) {
                                HStack {
                                    Text("Today's Progress")
                                        .font(.headline)
                                        .foregroundColor(.white)
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .foregroundColor(.white.opacity(0.5))
                                }
                                
                                HStack(spacing: 32) {
                                    // Water
                                    VStack {
                                        ZStack {
                                            Circle()
                                                .stroke(Color.white.opacity(0.1), lineWidth: 8)
                                                .frame(width: 80, height: 80)

                                            Circle()
                                                .trim(from: 0, to: memberData.water_progress.percentage)
                                                .stroke(Color.cyan, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                                                .frame(width: 80, height: 80)
                                                .rotationEffect(.degrees(-90))

                                            Image(systemName: "drop.fill")
                                                .foregroundColor(.cyan)
                                        }

                                        Text("\(String(format: "%.1f", memberData.water_progress.current / 1000))L")
                                            .font(.caption)
                                            .foregroundColor(.white)
                                    }

                                    // Exercise
                                    VStack {
                                        ZStack {
                                            Circle()
                                                .stroke(Color.white.opacity(0.1), lineWidth: 8)
                                                .frame(width: 80, height: 80)

                                            Circle()
                                                .trim(from: 0, to: memberData.exercise_progress.percentage)
                                                .stroke(Color.green, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                                                .frame(width: 80, height: 80)
                                                .rotationEffect(.degrees(-90))

                                            Image(systemName: "figure.run")
                                                .foregroundColor(.green)
                                        }

                                        Text("\(Int(memberData.exercise_progress.current)) min")
                                            .font(.caption)
                                            .foregroundColor(.white)
                                    }

                                    // Steps
                                    VStack {
                                        ZStack {
                                            Circle()
                                                .stroke(Color.white.opacity(0.1), lineWidth: 8)
                                                .frame(width: 80, height: 80)

                                            Circle()
                                                .trim(from: 0, to: memberData.steps_progress.percentage)
                                                .stroke(Color.orange, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                                                .frame(width: 80, height: 80)
                                                .rotationEffect(.degrees(-90))

                                            Image(systemName: "figure.walk")
                                                .foregroundColor(.orange)
                                        }

                                        Text(memberData.steps_progress.current >= 1000 ? "\(String(format: "%.1f", memberData.steps_progress.current / 1000))K steps" : "\(Int(memberData.steps_progress.current)) steps")
                                            .font(.caption)
                                            .foregroundColor(.white)
                                    }
                                }
                                
                                // Goals count
                                HStack {
                                    Image(systemName: "calendar")
                                        .foregroundColor(.orange)
                                    Text("\(memberData.completed_count)/\(memberData.total_goals) daily goals")
                                        .font(.caption)
                                        .foregroundColor(.white.opacity(0.7))
                                }

                                // HealthKit Sync Button
                                if HealthKitManager.isHealthKitAvailable() {
                                    if healthKitManager.isAuthorized {
                                        Button(action: {
                                            Task {
                                                await syncStepsFromHealthKit()
                                            }
                                        }) {
                                            HStack(spacing: 6) {
                                                if isSyncingSteps {
                                                    ProgressView()
                                                        .scaleEffect(0.7)
                                                        .tint(.white)
                                                } else {
                                                    Image(systemName: "arrow.triangle.2.circlepath")
                                                        .font(.caption)
                                                }
                                                Text(isSyncingSteps ? "Syncing..." : "Sync Health Data")
                                                    .font(.caption)
                                                    .fontWeight(.medium)
                                            }
                                            .foregroundColor(.white)
                                            .padding(.horizontal, 12)
                                            .padding(.vertical, 8)
                                            .background(Color.orange.opacity(0.8))
                                            .cornerRadius(8)
                                        }
                                        .disabled(isSyncingSteps)
                                    } else {
                                        Button(action: {
                                            Task {
                                                try? await healthKitManager.requestAuthorization()
                                            }
                                        }) {
                                            HStack(spacing: 6) {
                                                Image(systemName: "heart.text.square")
                                                    .font(.caption)
                                                Text("Connect Health App")
                                                    .font(.caption)
                                                    .fontWeight(.medium)
                                            }
                                            .foregroundColor(.white)
                                            .padding(.horizontal, 12)
                                            .padding(.vertical, 8)
                                            .background(Color.orange.opacity(0.6))
                                            .cornerRadius(8)
                                        }
                                    }
                                }
                            }
                            .padding()
                            .background(Color.white.opacity(0.05))
                            .cornerRadius(20)
                            .overlay(
                                RoundedRectangle(cornerRadius: 20)
                                    .stroke(Color.white.opacity(0.1), lineWidth: 1)
                            )
                        }
                        .padding(.horizontal)
                    }
                    
                    // Family Overview
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Family Overview")
                            .font(.headline)
                            .foregroundColor(.white)
                            .padding(.horizontal)
                        
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                            ForEach(dashboard) { member in
                                Button(action: { onViewMember(member) }) {
                                    VStack(alignment: .leading, spacing: 12) {
                                        HStack {
                                            Circle()
                                                .fill(Color(hex: member.avatar_color))
                                                .frame(width: 40, height: 40)
                                                .overlay(
                                                    Text(member.avatarInitial)
                                                        .font(.headline)
                                                        .fontWeight(.bold)
                                                        .foregroundColor(.white)
                                                )
                                            
                                            VStack(alignment: .leading) {
                                                Text(member.name)
                                                    .font(.subheadline)
                                                    .fontWeight(.medium)
                                                    .foregroundColor(.white)
                                                
                                                if member.id == appState.currentMember?.id {
                                                    Text("You")
                                                        .font(.caption2)
                                                        .foregroundColor(.purple)
                                                }
                                            }
                                        }
                                        
                                        // Progress bars
                                        VStack(spacing: 8) {
                                            ProgressBar(
                                                progress: member.water_progress.percentage,
                                                color: .cyan,
                                                icon: "drop.fill"
                                            )
                                            
                                            ProgressBar(
                                                progress: member.exercise_progress.percentage,
                                                color: .green,
                                                icon: "figure.run"
                                            )
                                            
                                            HStack(spacing: 4) {
                                                Image(systemName: "target")
                                                    .font(.caption2)
                                                    .foregroundColor(.orange)
                                                Text("\(member.completed_count)/\(member.total_goals)")
                                                    .font(.caption2)
                                                    .foregroundColor(.white.opacity(0.6))
                                            }
                                        }
                                    }
                                    .padding()
                                    .background(Color.white.opacity(0.05))
                                    .cornerRadius(16)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 16)
                                            .stroke(
                                                member.id == appState.currentMember?.id 
                                                    ? Color.purple 
                                                    : Color.white.opacity(0.1),
                                                lineWidth: member.id == appState.currentMember?.id ? 2 : 1
                                            )
                                    )
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                }
            }
            .padding(.vertical)
        }
        .refreshable {
            await loadDashboard()
        }
        .task {
            await loadDashboard()

            // Check authorization status and sync if authorized
            healthKitManager.checkAuthorizationStatus()
            print("HealthKit authorized: \(healthKitManager.isAuthorized)")

            if healthKitManager.isAuthorized {
                await syncStepsFromHealthKit()
                await syncWaterFromHealthKit()
            }
        }
    }

    private func syncWaterFromHealthKit() async {
        await MainActor.run {
            isSyncingWater = true
        }

        do {
            guard let memberId = appState.currentMember?.id else {
                await MainActor.run {
                    isSyncingWater = false
                }
                return
            }

            print("Fetching water from HealthKit...")
            let waterML = try await healthKitManager.fetchTodayWater()
            print("Fetched \(waterML)ml water from HealthKit")

            // Only sync if there's water data in HealthKit
            if waterML > 0 {
                // Note: This is a read-only sync from HealthKit to app
                // We don't overwrite app data, just inform the user
                print("HealthKit has \(waterML)ml water for today")
            }

            await MainActor.run {
                isSyncingWater = false
            }
        } catch {
            print("Failed to sync water from HealthKit: \(error)")
            await MainActor.run {
                isSyncingWater = false
            }
        }
    }

    private func loadDashboard() async {
        do {
            let data = try await APIService.shared.getDashboard()
            await MainActor.run {
                dashboard = data
                isLoading = false
            }
        } catch {
            print("Failed to load dashboard: \(error)")
            await MainActor.run {
                isLoading = false
            }
        }
    }

    private func syncStepsFromHealthKit() async {
        print("\n🔄 ========== SYNC STEPS STARTED ==========")
        await MainActor.run {
            isSyncingSteps = true
            syncErrorMessage = nil
            showSyncSuccess = false
        }

        do {
            guard let memberId = appState.currentMember?.id else {
                print("❌ No member selected - cannot sync")
                await MainActor.run {
                    isSyncingSteps = false
                    syncErrorMessage = "No member selected"
                }
                return
            }

            print("👤 Member ID: \(memberId)")
            print("🔐 HealthKit authorized: \(healthKitManager.isAuthorized)")

            if !healthKitManager.isAuthorized {
                print("❌ HealthKit is not authorized - cannot fetch steps")
                await MainActor.run {
                    isSyncingSteps = false
                    syncErrorMessage = "HealthKit not authorized"
                }
                return
            }

            print("📱 Calling fetchTodaySteps()...")
            let steps = try await healthKitManager.fetchTodaySteps()
            print("✅ Fetched \(steps) steps from HealthKit")

            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            let date = dateFormatter.string(from: Date())

            print("📤 Syncing to server: memberId=\(memberId), steps=\(steps), date=\(date)")
            try await APIService.shared.syncSteps(memberId: memberId, steps: Int(steps), date: date)
            print("✅ Successfully synced steps to server")

            print("🔄 Reloading dashboard...")
            await loadDashboard()
            print("✅ Dashboard reloaded")

            await MainActor.run {
                isSyncingSteps = false
                showSyncSuccess = true
            }
            print("✅ ========== SYNC STEPS COMPLETED ==========\n")

            // Hide success message after 2 seconds
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            await MainActor.run {
                showSyncSuccess = false
            }
        } catch {
            print("❌ ========== SYNC STEPS FAILED ==========")
            print("❌ Error: \(error)")
            print("❌ Error type: \(type(of: error))")
            print("❌ Localized description: \(error.localizedDescription)")

            let errorMsg = (error as? HealthKitError)?.localizedDescription ?? error.localizedDescription
            await MainActor.run {
                isSyncingSteps = false
                syncErrorMessage = errorMsg
            }
            print("❌ ==========================================\n")

            // Hide error message after 3 seconds
            try? await Task.sleep(nanoseconds: 3_000_000_000)
            await MainActor.run {
                syncErrorMessage = nil
            }
        }
    }
}

struct ProgressBar: View {
    let progress: Double
    let color: Color
    let icon: String
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.caption2)
                .foregroundColor(color)
                .frame(width: 16)
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.white.opacity(0.1))
                        .frame(height: 8)
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(color)
                        .frame(width: geometry.size.width * min(1, progress), height: 8)
                }
            }
            .frame(height: 8)
        }
    }
}

#Preview {
    DashboardView { _ in }
        .environmentObject(AppState())
}



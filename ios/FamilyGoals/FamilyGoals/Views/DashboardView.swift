import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var appState: AppState
    let onViewMember: (DashboardMember) -> Void
    
    @State private var dashboard: [DashboardMember] = []
    @State private var isLoading = true
    
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
                                }
                                
                                // Goals count
                                HStack {
                                    Image(systemName: "calendar")
                                        .foregroundColor(.orange)
                                    Text("\(memberData.completed_count)/\(memberData.total_goals) daily goals")
                                        .font(.caption)
                                        .foregroundColor(.white.opacity(0.7))
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


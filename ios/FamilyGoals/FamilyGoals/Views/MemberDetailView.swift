import SwiftUI

struct MemberDetailView: View {
    @EnvironmentObject var appState: AppState
    let member: DashboardMember
    let onBack: () -> Void
    
    @State private var waterData: (current: Double, target: Double) = (0, 2000)
    @State private var exerciseData: (current: Double, target: Double) = (0, 30)
    @State private var goals: [Goal] = []
    @State private var showWaterSheet = false
    @State private var showExerciseSheet = false
    @State private var waterAmount: Double = 250
    @State private var exerciseMinutes: Int = 30
    @State private var exerciseActivity = "Walking"
    
    var isOwnProfile: Bool {
        member.id == appState.currentMember?.id
    }
    
    var dailyGoals: [Goal] {
        goals.filter { $0.frequency != "weekly" && $0.type != "water" && $0.type != "exercise" }
    }
    
    var weeklyGoals: [Goal] {
        goals.filter { $0.frequency == "weekly" }
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                HStack {
                    Button(action: onBack) {
                        HStack(spacing: 4) {
                            Image(systemName: "chevron.left")
                            Text("Back")
                        }
                        .foregroundColor(.white.opacity(0.6))
                    }
                    
                    Spacer()
                    
                    Text(isOwnProfile ? "My Goals" : "\(member.name)'s Goals")
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    Spacer()
                    
                    Color.clear.frame(width: 60)
                }
                .padding(.horizontal)
                
                // Profile
                VStack(spacing: 12) {
                    Circle()
                        .fill(Color(hex: member.avatar_color))
                        .frame(width: 80, height: 80)
                        .overlay(
                            Text(member.avatarInitial)
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                        )
                    
                    Text(member.name)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    if isOwnProfile {
                        Text("Your Profile")
                            .font(.caption)
                            .foregroundColor(.purple)
                    }
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color.white.opacity(0.05))
                .cornerRadius(20)
                .padding(.horizontal)
                
                // Water & Exercise
                HStack(spacing: 16) {
                    // Water
                    VStack(spacing: 12) {
                        HStack {
                            Image(systemName: "drop.fill")
                                .foregroundColor(.cyan)
                            Spacer()
                            if isOwnProfile {
                                Button("+ Add") {
                                    showWaterSheet = true
                                }
                                .font(.caption)
                                .foregroundColor(.cyan)
                            }
                        }
                        
                        ZStack {
                            Circle()
                                .stroke(Color.white.opacity(0.1), lineWidth: 8)
                                .frame(width: 80, height: 80)
                            
                            Circle()
                                .trim(from: 0, to: min(1, waterData.current / waterData.target))
                                .stroke(Color.cyan, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                                .frame(width: 80, height: 80)
                                .rotationEffect(.degrees(-90))
                            
                            Text("\(Int(waterData.current / waterData.target * 100))%")
                                .font(.headline)
                                .foregroundColor(.white)
                        }
                        
                        Text("\(String(format: "%.1f", waterData.current / 1000))L / \(String(format: "%.1f", waterData.target / 1000))L")
                            .font(.caption)
                            .foregroundColor(.white)
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(16)
                    
                    // Exercise
                    VStack(spacing: 12) {
                        HStack {
                            Image(systemName: "figure.run")
                                .foregroundColor(.green)
                            Spacer()
                            if isOwnProfile {
                                Button("+ Add") {
                                    showExerciseSheet = true
                                }
                                .font(.caption)
                                .foregroundColor(.green)
                            }
                        }
                        
                        ZStack {
                            Circle()
                                .stroke(Color.white.opacity(0.1), lineWidth: 8)
                                .frame(width: 80, height: 80)
                            
                            Circle()
                                .trim(from: 0, to: min(1, exerciseData.current / exerciseData.target))
                                .stroke(Color.green, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                                .frame(width: 80, height: 80)
                                .rotationEffect(.degrees(-90))
                            
                            VStack(spacing: 0) {
                                Text("\(Int(exerciseData.current))")
                                    .font(.headline)
                                    .foregroundColor(.white)
                                Text("min")
                                    .font(.caption2)
                                    .foregroundColor(.white.opacity(0.5))
                            }
                        }
                        
                        Text("\(Int(exerciseData.current)) / 30 min")
                            .font(.caption)
                            .foregroundColor(.white)
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(16)
                }
                .padding(.horizontal)
                
                // Daily Goals
                if !dailyGoals.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Image(systemName: "calendar")
                                .foregroundColor(.orange)
                            Text("Daily Goals")
                                .font(.headline)
                                .foregroundColor(.white)
                        }
                        .padding(.horizontal)
                        
                        ForEach(dailyGoals) { goal in
                            GoalRow(goal: goal, isOwnProfile: isOwnProfile) {
                                toggleGoal(goal)
                            }
                        }
                    }
                }
                
                // Weekly Goals
                if !weeklyGoals.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Image(systemName: "target")
                                .foregroundColor(.purple)
                            Text("Weekly Goals")
                                .font(.headline)
                                .foregroundColor(.white)
                        }
                        .padding(.horizontal)
                        
                        ForEach(weeklyGoals) { goal in
                            GoalRow(goal: goal, isOwnProfile: isOwnProfile, isWeekly: true) {
                                toggleGoal(goal)
                            }
                        }
                    }
                }
            }
            .padding(.vertical)
        }
        .sheet(isPresented: $showWaterSheet) {
            WaterSheet(amount: $waterAmount) {
                await addWater()
            }
        }
        .sheet(isPresented: $showExerciseSheet) {
            ExerciseSheet(minutes: $exerciseMinutes, activity: $exerciseActivity) {
                await addExercise()
            }
        }
        .onAppear {
            waterData = (member.water_progress.current, member.water_progress.target)
            exerciseData = (member.exercise_progress.current, member.exercise_progress.target)
            goals = member.goals
        }
    }
    
    private func toggleGoal(_ goal: Goal) {
        guard isOwnProfile else { return }
        Task {
            do {
                _ = try await APIService.shared.completeGoal(goalId: goal.id, memberId: member.id)
                await MainActor.run {
                    if let index = goals.firstIndex(where: { $0.id == goal.id }) {
                        goals[index].is_completed?.toggle()
                    }
                }
            } catch {
                print("Failed to toggle goal: \(error)")
            }
        }
    }
    
    private func addWater() async {
        do {
            _ = try await APIService.shared.addWater(memberId: member.id, amountMl: waterAmount)
            let response = try await APIService.shared.getWater(memberId: member.id)
            await MainActor.run {
                waterData = (response.total, response.target)
                showWaterSheet = false
            }
        } catch {
            print("Failed to add water: \(error)")
        }
    }
    
    private func addExercise() async {
        do {
            _ = try await APIService.shared.addExercise(
                memberId: member.id,
                durationMinutes: exerciseMinutes,
                activity: exerciseActivity
            )
            let response = try await APIService.shared.getExercise(memberId: member.id)
            await MainActor.run {
                exerciseData = (Double(response.total), Double(response.target))
                showExerciseSheet = false
            }
        } catch {
            print("Failed to add exercise: \(error)")
        }
    }
}

struct GoalRow: View {
    let goal: Goal
    let isOwnProfile: Bool
    var isWeekly: Bool = false
    let onToggle: () -> Void
    
    var isCompleted: Bool {
        goal.is_completed ?? false
    }
    
    var body: some View {
        HStack(spacing: 16) {
            Button(action: { if isOwnProfile { onToggle() } }) {
                Circle()
                    .fill(isCompleted ? (isWeekly ? Color.purple : Color.green) : Color.clear)
                    .frame(width: 32, height: 32)
                    .overlay(
                        Circle()
                            .stroke(isCompleted ? Color.clear : Color.white.opacity(0.3), lineWidth: 2)
                    )
                    .overlay(
                        Image(systemName: "checkmark")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .opacity(isCompleted ? 1 : 0)
                    )
            }
            .disabled(!isOwnProfile)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(goal.title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(isCompleted ? .white.opacity(0.6) : .white)
                    .strikethrough(isCompleted)
                
                if let description = goal.description, !description.isEmpty {
                    Text(description)
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.5))
                }
                
                if goal.type == "assigned", let assignedBy = goal.assigned_by_name {
                    Text("From \(assignedBy)")
                        .font(.caption2)
                        .foregroundColor(.purple)
                }
            }
            
            Spacer()
        }
        .padding()
        .background(isCompleted ? (isWeekly ? Color.purple.opacity(0.1) : Color.green.opacity(0.1)) : Color.white.opacity(0.05))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isWeekly ? Color.purple.opacity(0.3) : Color.white.opacity(0.1), lineWidth: isWeekly ? 2 : 1)
        )
        .padding(.horizontal)
    }
}

struct WaterSheet: View {
    @Environment(\.dismiss) var dismiss
    @Binding var amount: Double
    let onAdd: () async -> Void
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                Text("\(Int(amount)) ml")
                    .font(.system(size: 48, weight: .bold))
                    .foregroundColor(.white)
                
                HStack(spacing: 24) {
                    Button(action: { amount = max(50, amount - 50) }) {
                        Image(systemName: "minus.circle.fill")
                            .font(.system(size: 44))
                            .foregroundColor(.white.opacity(0.5))
                    }
                    
                    Button(action: { amount = min(2000, amount + 50) }) {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 44))
                            .foregroundColor(.cyan)
                    }
                }
                
                HStack(spacing: 8) {
                    ForEach([100, 250, 500, 750], id: \.self) { preset in
                        Button("\(preset)ml") {
                            amount = Double(preset)
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(amount == Double(preset) ? Color.cyan : Color.white.opacity(0.1))
                        .foregroundColor(.white)
                        .cornerRadius(8)
                    }
                }
                
                Button(action: {
                    Task { await onAdd() }
                }) {
                    Text("Add \(Int(amount))ml")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.cyan)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }
                .padding(.horizontal)
            }
            .padding()
            .background(Color(red: 0.1, green: 0.1, blue: 0.24))
            .navigationTitle("Add Water")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}

struct ExerciseSheet: View {
    @Environment(\.dismiss) var dismiss
    @Binding var minutes: Int
    @Binding var activity: String
    let onAdd: () async -> Void
    
    let activities = ["Walking", "Running", "Cycling", "Swimming", "Yoga", "Gym", "Sports", "HIIT", "Stretching"]
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                Picker("Activity", selection: $activity) {
                    ForEach(activities, id: \.self) { activity in
                        Text(activity).tag(activity)
                    }
                }
                .pickerStyle(.wheel)
                
                Text("\(minutes) minutes")
                    .font(.system(size: 48, weight: .bold))
                    .foregroundColor(.white)
                
                HStack(spacing: 24) {
                    Button(action: { minutes = max(5, minutes - 5) }) {
                        Image(systemName: "minus.circle.fill")
                            .font(.system(size: 44))
                            .foregroundColor(.white.opacity(0.5))
                    }
                    
                    Button(action: { minutes = min(180, minutes + 5) }) {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 44))
                            .foregroundColor(.green)
                    }
                }
                
                Button(action: {
                    Task { await onAdd() }
                }) {
                    Text("Log \(minutes) minutes")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }
                .padding(.horizontal)
            }
            .padding()
            .background(Color(red: 0.1, green: 0.1, blue: 0.24))
            .navigationTitle("Log Exercise")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}

#Preview {
    MemberDetailView(
        member: DashboardMember(
            id: "1",
            name: "John",
            avatar_color: "#6366f1",
            profile_photo_url: nil,
            goals: [],
            water_progress: ProgressData(current: 1500, target: 2000),
            exercise_progress: ProgressData(current: 20, target: 30),
            completed_count: 3,
            total_goals: 5,
            weekly_completed_count: 1,
            weekly_total_goals: 2
        ),
        onBack: {}
    )
    .environmentObject(AppState())
}


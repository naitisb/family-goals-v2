import SwiftUI

struct MemberDetailView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var healthKitManager: HealthKitManager
    let member: DashboardMember
    let onBack: () -> Void

    @State private var waterData: (current: Double, target: Double) = (0, 2000)
    @State private var exerciseData: (current: Double, target: Double) = (0, 30)
    @State private var stepsData: (current: Int, target: Int) = (0, 10000)
    @State private var mindfulnessData: (current: Int, target: Int) = (0, 15)
    @State private var goals: [Goal] = []
    @State private var showWaterSheet = false
    @State private var showExerciseSheet = false
    @State private var showMindfulnessSheet = false
    @State private var showWaterInfo = false
    @State private var showExerciseInfo = false
    @State private var showStepsInfo = false
    @State private var showMindfulnessInfo = false
    @State private var waterAmount: Double = 250
    @State private var exerciseMinutes: Int = 30
    @State private var mindfulnessMinutes: Int = 15
    @State private var exerciseActivity = "Walking"
    
    var isOwnProfile: Bool {
        member.id == appState.currentMember?.id
    }
    
    var dailyGoals: [Goal] {
        goals.filter { $0.frequency != "weekly" && $0.type != "water" && $0.type != "exercise" && $0.type != "steps" && $0.type != "mindfulness" }
    }
    
    var weeklyGoals: [Goal] {
        goals.filter { $0.frequency == "weekly" }
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                headerSection
                profileSection
                waterAndExerciseWidgets
                stepsWidget
                mindfulnessWidget

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
        .sheet(isPresented: $showMindfulnessSheet) {
            MindfulnessSheet(minutes: $mindfulnessMinutes) {
                await addMindfulness()
            }
        }
        .sheet(isPresented: $showWaterInfo) {
            InfoSheet(
                title: "Hydration Facts",
                icon: "drop.fill",
                color: .cyan,
                content: WaterInfoContent()
            )
        }
        .sheet(isPresented: $showExerciseInfo) {
            InfoSheet(
                title: "Exercise Benefits",
                icon: "figure.run",
                color: .green,
                content: ExerciseInfoContent()
            )
        }
        .sheet(isPresented: $showStepsInfo) {
            InfoSheet(
                title: "Walking Benefits",
                icon: "figure.walk",
                color: .orange,
                content: StepsInfoContent()
            )
        }
        .sheet(isPresented: $showMindfulnessInfo) {
            InfoSheet(
                title: "Mindfulness Benefits",
                icon: "brain.head.profile",
                color: .purple,
                content: MindfulnessInfoContent()
            )
        }
        .onAppear {
            waterData = (member.water_progress.current, member.water_progress.target)
            exerciseData = (member.exercise_progress.current, member.exercise_progress.target)
            stepsData = (Int(member.steps_progress.current), Int(member.steps_progress.target))
            mindfulnessData = (Int(member.mindfulness_progress.current), Int(member.mindfulness_progress.target))
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

            // Also save to HealthKit if authorized
            if healthKitManager.isAuthorized {
                do {
                    try await healthKitManager.saveWater(amountML: waterAmount)
                    print("Saved \(waterAmount)ml water to HealthKit")
                } catch {
                    print("Failed to save water to HealthKit: \(error)")
                    // Don't fail the whole operation if HealthKit save fails
                }
            }

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

    private func addMindfulness() async {
        do {
            _ = try await APIService.shared.addMindfulness(
                memberId: member.id,
                durationMinutes: mindfulnessMinutes
            )
            let response = try await APIService.shared.getMindfulness(memberId: member.id)
            await MainActor.run {
                mindfulnessData = (response.total, response.target)
                showMindfulnessSheet = false
            }
        } catch {
            print("Failed to add mindfulness: \(error)")
        }
    }

    private func syncStepsFromHealthKit() async {
        guard isOwnProfile && healthKitManager.isAuthorized else { return }

        do {
            let steps = try await healthKitManager.fetchTodaySteps()
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            let today = dateFormatter.string(from: Date())

            _ = try await APIService.shared.syncSteps(
                memberId: member.id,
                steps: steps,
                date: today,
                source: "healthkit"
            )

            let response = try await APIService.shared.getSteps(memberId: member.id, date: today)
            await MainActor.run {
                stepsData = (response.total, response.target)
            }
        } catch {
            print("Failed to sync steps from HealthKit: \(error)")
        }
    }

    // MARK: - Computed Properties for View Components

    private var headerSection: some View {
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
    }

    private var profileSection: some View {
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
    }

    private var waterAndExerciseWidgets: some View {
        HStack(spacing: 16) {
            waterWidget
            exerciseWidget
        }
        .padding(.horizontal)
    }

    private var waterWidget: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: "drop.fill")
                    .foregroundColor(.cyan)
                Button(action: { showWaterInfo = true }) {
                    Image(systemName: "info.circle")
                        .font(.caption)
                        .foregroundColor(.cyan.opacity(0.6))
                }
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
    }

    private var exerciseWidget: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: "figure.run")
                    .foregroundColor(.green)
                Button(action: { showExerciseInfo = true }) {
                    Image(systemName: "info.circle")
                        .font(.caption)
                        .foregroundColor(.green.opacity(0.6))
                }
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

    private var stepsWidget: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: "figure.walk")
                    .foregroundColor(.orange)
                Text("Daily Steps")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                Button(action: { showStepsInfo = true }) {
                    Image(systemName: "info.circle")
                        .font(.caption)
                        .foregroundColor(.orange.opacity(0.6))
                }
                Spacer()
            }

            HStack(spacing: 16) {
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.1), lineWidth: 8)
                        .frame(width: 80, height: 80)

                    Circle()
                        .trim(from: 0, to: min(1, Double(stepsData.current) / Double(stepsData.target)))
                        .stroke(Color.orange, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                        .frame(width: 80, height: 80)
                        .rotationEffect(.degrees(-90))

                    Text("\(Int(Double(stepsData.current) / Double(stepsData.target) * 100))%")
                        .font(.headline)
                        .foregroundColor(.white)
                }

                VStack(alignment: .leading, spacing: 8) {
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(stepsData.current >= 1000 ? "\(String(format: "%.1f", Double(stepsData.current) / 1000))K" : "\(stepsData.current)")
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        Text("/ \(stepsData.target >= 1000 ? "\(stepsData.target / 1000)K" : "\(stepsData.target)") steps")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.6))
                    }

                    if isOwnProfile && healthKitManager.isAuthorized {
                        Button(action: {
                            Task {
                                await syncStepsFromHealthKit()
                            }
                        }) {
                            HStack(spacing: 4) {
                                Image(systemName: "arrow.triangle.2.circlepath")
                                    .font(.caption)
                                Text("Sync Health Data")
                                    .font(.caption)
                            }
                            .foregroundColor(.orange)
                        }
                    } else if isOwnProfile && HealthKitManager.isHealthKitAvailable() {
                        Button("Connect Health App") {
                            Task {
                                do {
                                    print("🔘 Connect Health App button tapped")
                                    try await healthKitManager.requestAuthorization()
                                    print("🔄 Re-checking authorization status...")
                                    healthKitManager.checkAuthorizationStatus()

                                    // If authorized, try syncing immediately
                                    if healthKitManager.isAuthorized {
                                        print("✅ Authorized! Syncing steps...")
                                        await syncStepsFromHealthKit()
                                    } else {
                                        print("⚠️ Not authorized yet. User may need to grant permission in Health app.")
                                    }
                                } catch {
                                    print("❌ Authorization error: \(error)")
                                }
                            }
                        }
                        .font(.caption)
                        .foregroundColor(.orange.opacity(0.7))
                    }
                }
            }
        }
        .padding()
        .background(Color.white.opacity(0.05))
        .cornerRadius(16)
        .padding(.horizontal)
    }

    private var mindfulnessWidget: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: "brain.head.profile")
                    .foregroundColor(.purple)
                Text("Daily Mindfulness")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                Button(action: { showMindfulnessInfo = true }) {
                    Image(systemName: "info.circle")
                        .font(.caption)
                        .foregroundColor(.purple.opacity(0.6))
                }
                Spacer()
            }

            HStack(spacing: 16) {
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.1), lineWidth: 8)
                        .frame(width: 80, height: 80)

                    Circle()
                        .trim(from: 0, to: min(1, Double(mindfulnessData.current) / Double(mindfulnessData.target)))
                        .stroke(Color.purple, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                        .frame(width: 80, height: 80)
                        .rotationEffect(.degrees(-90))

                    Text("\(Int(Double(mindfulnessData.current) / Double(mindfulnessData.target) * 100))%")
                        .font(.headline)
                        .foregroundColor(.white)
                }

                VStack(alignment: .leading, spacing: 8) {
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(mindfulnessData.current)")
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        Text("/ \(mindfulnessData.target) min")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.6))
                    }

                    if isOwnProfile {
                        Button(action: {
                            showMindfulnessSheet = true
                        }) {
                            HStack(spacing: 4) {
                                Image(systemName: "plus.circle.fill")
                                    .font(.caption)
                                Text("Log Session")
                                    .font(.caption)
                            }
                            .foregroundColor(.purple)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color.white.opacity(0.05))
        .cornerRadius(16)
        .padding(.horizontal)
    }
}

// MARK: - Info Sheet
struct InfoSheet<Content: View>: View {
    @Environment(\.dismiss) var dismiss
    let title: String
    let icon: String
    let color: Color
    let content: Content

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    content
                }
                .padding()
            }
            .background(Color(red: 0.1, green: 0.1, blue: 0.24))
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
            }
        }
    }
}

// MARK: - Water Info Content
struct WaterInfoContent: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Recommended Daily Water Intake")
                .font(.headline)
                .foregroundColor(.cyan)

            VStack(alignment: .leading, spacing: 8) {
                BulletPoint(text: "Men: 3.7L (125 oz)")
                BulletPoint(text: "Women: 2.7L (91 oz)")
                BulletPoint(text: "Teens: 2-3L")
                BulletPoint(text: "Children: 1-2L")
            }
            .foregroundColor(.white.opacity(0.9))

            Link(destination: URL(string: "https://nap.nationalacademies.org/read/10925")!) {
                HStack {
                    Image(systemName: "link")
                    Text("National Academies of Sciences")
                        .underline()
                }
                .font(.caption)
                .foregroundColor(.cyan)
            }
        }
    }
}

// MARK: - Exercise Info Content
struct ExerciseInfoContent: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Benefits of 30 Minutes Daily Exercise")
                .font(.headline)
                .foregroundColor(.green)

            VStack(alignment: .leading, spacing: 8) {
                BulletPoint(text: "Reduces risk of cardiovascular disease by 30-40%")
                BulletPoint(text: "Lowers risk of type 2 diabetes by 30%")
                BulletPoint(text: "Reduces symptoms of depression and anxiety")
                BulletPoint(text: "Improves cognitive function and memory")
                BulletPoint(text: "Strengthens bones and muscles")
                BulletPoint(text: "Helps maintain healthy weight")
            }
            .foregroundColor(.white.opacity(0.9))

            Text("Moderate-intensity exercise for 150 minutes/week (30 min × 5 days) or 75 minutes of vigorous activity is recommended.")
                .font(.caption)
                .foregroundColor(.white.opacity(0.7))
                .padding(.top, 4)

            Link(destination: URL(string: "https://www.who.int/news-room/fact-sheets/detail/physical-activity")!) {
                HStack {
                    Image(systemName: "link")
                    Text("WHO Physical Activity Guidelines")
                        .underline()
                }
                .font(.caption)
                .foregroundColor(.green)
            }
        }
    }
}

// MARK: - Steps Info Content
struct StepsInfoContent: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Benefits of Daily Walking")
                .font(.headline)
                .foregroundColor(.orange)

            VStack(alignment: .leading, spacing: 8) {
                BulletPoint(text: "7,000+ steps/day reduces all-cause mortality risk by 50-70%")
                BulletPoint(text: "Lowers blood pressure and improves cardiovascular health")
                BulletPoint(text: "Reduces risk of dementia by 25% (walking 9,800 steps/day)")
                BulletPoint(text: "Improves mood and reduces stress")
                BulletPoint(text: "Helps maintain bone density")
                BulletPoint(text: "Supports healthy weight management")
            }
            .foregroundColor(.white.opacity(0.9))

            Text("Optimal Range")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.orange)
                .padding(.top, 4)

            Text("7,000-10,000 steps per day provides maximum health benefits. Even 4,000 steps/day shows significant improvements over sedentary behavior.")
                .font(.caption)
                .foregroundColor(.white.opacity(0.7))

            Link(destination: URL(string: "https://jamanetwork.com/journals/jama/fullarticle/2783711")!) {
                HStack {
                    Image(systemName: "link")
                    Text("JAMA: Steps Per Day and All-Cause Mortality")
                        .underline()
                }
                .font(.caption)
                .foregroundColor(.orange)
            }

            Link(destination: URL(string: "https://jamanetwork.com/journals/jamaneurology/fullarticle/2805553")!) {
                HStack {
                    Image(systemName: "link")
                    Text("JAMA Neurology: Walking and Dementia Risk")
                        .underline()
                }
                .font(.caption)
                .foregroundColor(.orange)
            }
        }
    }
}

// MARK: - Mindfulness Info Content
struct MindfulnessInfoContent: View {
    private var benefitsSection: some View {
        Group {
            Text("Benefits of Mindfulness Practice")
                .font(.headline)
                .foregroundColor(.purple)

            VStack(alignment: .leading, spacing: 8) {
                BulletPoint(text: "Reduces stress and anxiety symptoms by 30-40%")
                BulletPoint(text: "Improves attention and focus")
                BulletPoint(text: "Enhances emotional regulation")
                BulletPoint(text: "Decreases symptoms of depression")
                BulletPoint(text: "Lowers blood pressure and cortisol levels")
                BulletPoint(text: "Improves sleep quality")
            }
            .foregroundColor(.white.opacity(0.9))
        }
    }

    private var dbtSection: some View {
        Group {
            Text("DBT Mindfulness Skills")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.purple)
                .padding(.top, 8)

            Text("Dialectical Behavior Therapy (DBT) teaches practical mindfulness skills:")
                .font(.caption)
                .foregroundColor(.white.opacity(0.7))

            VStack(alignment: .leading, spacing: 6) {
                BulletPoint(text: "Observe: Notice without judgment", size: .caption)
                BulletPoint(text: "Describe: Put words to experience", size: .caption)
                BulletPoint(text: "Participate: Engage in present", size: .caption)
                BulletPoint(text: "One-mindfully: Focus on one thing", size: .caption)
                BulletPoint(text: "Non-judgmentally: Accept as is", size: .caption)
                BulletPoint(text: "Effectively: Do what works", size: .caption)
            }
            .foregroundColor(.white.opacity(0.8))
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            benefitsSection

            Text("Practice Options")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.purple)
                .padding(.top, 8)

            VStack(alignment: .leading, spacing: 6) {
                BulletPoint(text: "Breath awareness: Focus on natural breathing rhythm", size: .caption)
                BulletPoint(text: "Body scan: Progressive relaxation from head to toe", size: .caption)
                BulletPoint(text: "Mindful walking: Conscious attention to each step", size: .caption)
                BulletPoint(text: "Loving-kindness meditation: Cultivate compassion for self and others", size: .caption)
                BulletPoint(text: "Guided meditation: Follow audio instructions", size: .caption)
                BulletPoint(text: "Mindful eating: Full sensory awareness while eating", size: .caption)
            }
            .foregroundColor(.white.opacity(0.8))

            dbtSection

            Text("15 minutes daily recommended")
                .font(.caption)
                .foregroundColor(.white.opacity(0.7))
                .padding(.top, 4)

            Link(destination: URL(string: "https://jamanetwork.com/journals/jamapsychiatry/fullarticle/2798431")!) {
                HStack {
                    Image(systemName: "link")
                    Text("JAMA Psychiatry Study")
                }
                .font(.caption)
                .foregroundColor(.purple)
            }
        }
    }
}

// MARK: - Mindfulness Sheet
struct MindfulnessSheet: View {
    @Environment(\.dismiss) var dismiss
    @Binding var minutes: Int
    let onAdd: () async -> Void

    @State private var isAdding = false

    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // Illustration
                ZStack {
                    Circle()
                        .fill(LinearGradient(
                            colors: [Color.purple.opacity(0.3), Color.purple.opacity(0.1)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ))
                        .frame(width: 120, height: 120)

                    Image(systemName: "brain.head.profile")
                        .font(.system(size: 50))
                        .foregroundColor(.purple)
                }
                .padding(.top, 32)

                VStack(spacing: 16) {
                    Text("Log Mindfulness Session")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)

                    // Duration Picker
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Duration")
                            .font(.headline)
                            .foregroundColor(.white)

                        Picker("Minutes", selection: $minutes) {
                            ForEach([5, 10, 15, 20, 30, 45, 60], id: \.self) { min in
                                Text("\(min) min").tag(min)
                            }
                        }
                        .pickerStyle(.wheel)
                        .frame(height: 150)
                    }

                    Button(action: {
                        isAdding = true
                        Task {
                            await onAdd()
                            isAdding = false
                        }
                    }) {
                        HStack {
                            if isAdding {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Image(systemName: "checkmark.circle.fill")
                                Text("Log Session")
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.purple)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(isAdding)
                    .padding(.horizontal)
                }
                .padding()

                Spacer()
            }
            .padding()
            .background(Color(red: 0.1, green: 0.1, blue: 0.24))
            .navigationTitle("Mindfulness")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
            }
        }
    }
}

// MARK: - Bullet Point Helper
struct BulletPoint: View {
    let text: String
    var size: Font = .subheadline

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Text("•")
                .font(size)
            Text(text)
                .font(size)
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

                // Water Intake Recommendations
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "info.circle")
                            .foregroundColor(.cyan.opacity(0.7))
                        Text("Daily Water Recommendations")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.cyan)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text("• Adult Men: 3.7L (125 oz)")
                            .font(.caption2)
                            .foregroundColor(.white.opacity(0.6))
                        Text("• Adult Women: 2.7L (91 oz)")
                            .font(.caption2)
                            .foregroundColor(.white.opacity(0.6))
                        Text("• Teenagers: 2-3L")
                            .font(.caption2)
                            .foregroundColor(.white.opacity(0.6))
                        Text("• Children: 1-2L")
                            .font(.caption2)
                            .foregroundColor(.white.opacity(0.6))
                    }

                    Link(destination: URL(string: "https://nap.nationalacademies.org/read/10925")!) {
                        HStack(spacing: 4) {
                            Text("Source: National Academies of Sciences")
                                .font(.caption2)
                                .foregroundColor(.cyan.opacity(0.8))
                            Image(systemName: "arrow.up.right.square")
                                .font(.caption2)
                                .foregroundColor(.cyan.opacity(0.8))
                        }
                    }
                }
                .padding()
                .background(Color.cyan.opacity(0.1))
                .cornerRadius(12)
                .padding(.horizontal)

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
            steps_progress: ProgressData(current: 5432, target: 10000),
            mindfulness_progress: ProgressData(current: 10, target: 15),
            completed_count: 3,
            total_goals: 5,
            weekly_completed_count: 1,
            weekly_total_goals: 2
        ),
        onBack: {}
    )
    .environmentObject(AppState())
    .environmentObject(HealthKitManager())
}



import SwiftUI

struct RegisterView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var appState: AppState

    @State private var familyName = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var showPassword = false
    @State private var members: [RegisterMember] = [
        RegisterMember(name: "", pin: "", avatarColor: "#6366f1"),
        RegisterMember(name: "", pin: "", avatarColor: "#ec4899")
    ]
    @State private var isLoading = false
    @State private var errorMessage: String?

    let avatarColors = [
        "#6366f1", // indigo
        "#ec4899", // pink
        "#8b5cf6", // purple
        "#10b981", // green
        "#f59e0b", // amber
        "#ef4444", // red
        "#3b82f6", // blue
        "#14b8a6", // teal
        "#f97316", // orange
        "#a855f7"  // violet
    ]

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    VStack(spacing: 8) {
                        Circle()
                            .fill(LinearGradient(
                                colors: [.purple, .pink],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ))
                            .frame(width: 60, height: 60)
                            .overlay(
                                Image(systemName: "person.3.fill")
                                    .font(.system(size: 24))
                                    .foregroundColor(.white)
                            )

                        Text("Create Family Account")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)

                        Text("Set up your family and start tracking goals together")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.6))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }
                    .padding(.top)

                    // Family Info
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Family Information")
                            .font(.headline)
                            .foregroundColor(.white)

                        TextField("Family Name", text: $familyName)
                            .textFieldStyle(GlassTextFieldStyle())
                            .autocapitalization(.words)

                        HStack {
                            if showPassword {
                                TextField("Password", text: $password)
                            } else {
                                SecureField("Password", text: $password)
                            }

                            Button(action: { showPassword.toggle() }) {
                                Image(systemName: showPassword ? "eye.slash" : "eye")
                                    .foregroundColor(.white.opacity(0.5))
                            }
                        }
                        .textFieldStyle(GlassTextFieldStyle())

                        if showPassword {
                            TextField("Confirm Password", text: $confirmPassword)
                                .textFieldStyle(GlassTextFieldStyle())
                        } else {
                            SecureField("Confirm Password", text: $confirmPassword)
                                .textFieldStyle(GlassTextFieldStyle())
                        }
                    }
                    .padding(.horizontal)

                    // Members
                    VStack(alignment: .leading, spacing: 16) {
                        HStack {
                            Text("Family Members (min. 2)")
                                .font(.headline)
                                .foregroundColor(.white)

                            Spacer()

                            if members.count < 10 {
                                Button(action: addMember) {
                                    Image(systemName: "plus.circle.fill")
                                        .foregroundColor(.purple)
                                }
                            }
                        }

                        ForEach(members.indices, id: \.self) { index in
                            MemberInputRow(
                                member: $members[index],
                                colors: avatarColors,
                                canDelete: members.count > 2,
                                onDelete: { removeMember(at: index) }
                            )
                        }
                    }
                    .padding(.horizontal)

                    // Error Message
                    if let error = errorMessage {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                            .padding(.horizontal)
                            .multilineTextAlignment(.center)
                    }

                    // Register Button
                    Button(action: register) {
                        if isLoading {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text("Create Family Account")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(
                        LinearGradient(
                            colors: [.purple, .purple.opacity(0.8)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .foregroundColor(.white)
                    .cornerRadius(12)
                    .disabled(!isFormValid || isLoading)
                    .opacity(!isFormValid ? 0.6 : 1.0)
                    .padding(.horizontal)
                    .padding(.bottom)
                }
            }
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

    private var isFormValid: Bool {
        !familyName.isEmpty &&
        !password.isEmpty &&
        password.count >= 6 &&
        password == confirmPassword &&
        members.count >= 2 &&
        members.allSatisfy { !$0.name.isEmpty && !$0.pin.isEmpty && $0.pin.count == 4 }
    }

    private func addMember() {
        guard members.count < 10 else { return }
        let nextColorIndex = members.count % avatarColors.count
        members.append(RegisterMember(name: "", pin: "", avatarColor: avatarColors[nextColorIndex]))
    }

    private func removeMember(at index: Int) {
        guard members.count > 2 else { return }
        members.remove(at: index)
    }

    private func register() {
        errorMessage = nil
        isLoading = true

        Task {
            do {
                let memberDicts = members.map { member in
                    [
                        "name": member.name,
                        "pin": member.pin,
                        "avatarColor": member.avatarColor
                    ] as [String: Any]
                }

                let response = try await APIService.shared.register(
                    familyName: familyName,
                    password: password,
                    members: memberDicts
                )

                await MainActor.run {
                    appState.login(response: response)
                    isLoading = false
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    isLoading = false
                }
            }
        }
    }
}

struct RegisterMember {
    var name: String
    var pin: String
    var avatarColor: String
}

struct MemberInputRow: View {
    @Binding var member: RegisterMember
    let colors: [String]
    let canDelete: Bool
    let onDelete: () -> Void

    var body: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                // Avatar Color Picker
                Menu {
                    ForEach(colors, id: \.self) { color in
                        Button(action: { member.avatarColor = color }) {
                            HStack {
                                Circle()
                                    .fill(Color(hex: color))
                                    .frame(width: 24, height: 24)
                                Text(color)
                            }
                        }
                    }
                } label: {
                    Circle()
                        .fill(Color(hex: member.avatarColor))
                        .frame(width: 40, height: 40)
                        .overlay(
                            Circle()
                                .stroke(Color.white.opacity(0.3), lineWidth: 2)
                        )
                }

                // Name Input
                TextField("Name", text: $member.name)
                    .textFieldStyle(GlassTextFieldStyle())
                    .autocapitalization(.words)

                // Delete Button
                if canDelete {
                    Button(action: onDelete) {
                        Image(systemName: "minus.circle.fill")
                            .foregroundColor(.red.opacity(0.8))
                    }
                }
            }

            // PIN Input
            HStack(spacing: 8) {
                Image(systemName: "lock.fill")
                    .foregroundColor(.white.opacity(0.5))
                    .font(.caption)

                TextField("4-digit PIN", text: $member.pin)
                    .keyboardType(.numberPad)
                    .onChange(of: member.pin) { newValue in
                        // Limit to 4 digits
                        if newValue.count > 4 {
                            member.pin = String(newValue.prefix(4))
                        }
                    }
                    .textFieldStyle(GlassTextFieldStyle())
            }
        }
        .padding()
        .background(Color.white.opacity(0.03))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color(hex: member.avatarColor).opacity(0.3), lineWidth: 1)
        )
    }
}

#Preview {
    RegisterView()
        .environmentObject(AppState())
}

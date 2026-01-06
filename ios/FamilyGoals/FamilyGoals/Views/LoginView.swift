import SwiftUI

struct LoginView: View {
    @EnvironmentObject var appState: AppState
    @State private var familyName = ""
    @State private var password = ""
    @State private var showPassword = false
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            
            // Logo
            Circle()
                .fill(LinearGradient(
                    colors: [.purple, .pink],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ))
                .frame(width: 80, height: 80)
                .overlay(
                    Image(systemName: "person.3.fill")
                        .font(.system(size: 32))
                        .foregroundColor(.white)
                )
            
            Text("Family Goals")
                .font(.largeTitle)
                .fontWeight(.bold)
                .foregroundStyle(
                    LinearGradient(
                        colors: [.purple, .pink, .orange],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
            
            Text("Track goals together")
                .foregroundColor(.white.opacity(0.6))
            
            // Form
            VStack(spacing: 16) {
                TextField("Family Name", text: $familyName)
                    .textFieldStyle(GlassTextFieldStyle())
                    .autocapitalization(.none)
                
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
                
                if let error = errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                        .padding(.horizontal)
                }
                
                Button(action: login) {
                    if isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("Login")
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
                .disabled(isLoading || familyName.isEmpty || password.isEmpty)
            }
            .padding(.horizontal, 32)
            
            Spacer()
        }
    }
    
    private func login() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let response = try await APIService.shared.login(
                    familyName: familyName,
                    password: password
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

struct GlassTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding()
            .background(Color.white.opacity(0.05))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.white.opacity(0.1), lineWidth: 1)
            )
            .foregroundColor(.white)
    }
}

#Preview {
    LoginView()
        .environmentObject(AppState())
}



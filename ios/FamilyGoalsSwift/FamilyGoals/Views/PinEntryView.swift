import SwiftUI

struct PinEntryView: View {
    @EnvironmentObject var appState: AppState
    let member: Member
    let onBack: () -> Void
    
    @State private var pin = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var shake = false
    
    var body: some View {
        VStack(spacing: 24) {
            // Back button
            HStack {
                Button(action: onBack) {
                    HStack(spacing: 4) {
                        Image(systemName: "chevron.left")
                        Text("Back")
                    }
                    .foregroundColor(.white.opacity(0.6))
                }
                Spacer()
            }
            .padding(.horizontal)
            
            Spacer()
            
            // Avatar
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
                .fontWeight(.semibold)
                .foregroundColor(.white)
            
            Text("Enter your PIN")
                .foregroundColor(.white.opacity(0.6))
            
            // PIN dots
            HStack(spacing: 16) {
                ForEach(0..<4, id: \.self) { index in
                    Circle()
                        .fill(index < pin.count ? Color.purple : Color.white.opacity(0.2))
                        .frame(width: 16, height: 16)
                        .scaleEffect(index < pin.count ? 1.2 : 1.0)
                        .animation(.easeInOut(duration: 0.15), value: pin.count)
                }
            }
            .modifier(ShakeModifier(shake: shake))
            
            if let error = errorMessage {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
            }
            
            // Number pad
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3), spacing: 16) {
                ForEach(1...9, id: \.self) { number in
                    NumberButton(number: "\(number)") {
                        addDigit("\(number)")
                    }
                }
                
                Spacer()
                    .frame(height: 72)
                
                NumberButton(number: "0") {
                    addDigit("0")
                }
                
                Button(action: deleteDigit) {
                    Text("←")
                        .font(.title)
                        .fontWeight(.medium)
                        .frame(width: 72, height: 72)
                        .foregroundColor(.white)
                }
            }
            .padding(.horizontal, 40)
            
            Spacer()
        }
    }
    
    private func addDigit(_ digit: String) {
        guard pin.count < 4 else { return }
        pin += digit
        
        if pin.count == 4 {
            verifyPin()
        }
    }
    
    private func deleteDigit() {
        guard !pin.isEmpty else { return }
        pin.removeLast()
        errorMessage = nil
    }
    
    private func verifyPin() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let response = try await APIService.shared.verifyPin(
                    memberId: member.id,
                    pin: pin
                )
                await MainActor.run {
                    appState.setCurrentMember(response.member, token: response.token)
                    isLoading = false
                }
            } catch {
                await MainActor.run {
                    errorMessage = "Invalid PIN"
                    pin = ""
                    shake = true
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        shake = false
                    }
                    isLoading = false
                }
            }
        }
    }
}

struct NumberButton: View {
    let number: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(number)
                .font(.title)
                .fontWeight(.semibold)
                .frame(width: 72, height: 72)
                .background(Color.white.opacity(0.05))
                .foregroundColor(.white)
                .clipShape(Circle())
                .overlay(
                    Circle()
                        .stroke(Color.white.opacity(0.1), lineWidth: 1)
                )
        }
    }
}

struct ShakeModifier: ViewModifier {
    let shake: Bool
    
    func body(content: Content) -> some View {
        content
            .offset(x: shake ? -10 : 0)
            .animation(
                shake ? Animation.default.repeatCount(4, autoreverses: true).speed(6) : .default,
                value: shake
            )
    }
}

#Preview {
    PinEntryView(
        member: Member(id: "1", family_id: "1", name: "John", pin: nil, avatar_color: "#6366f1", profile_photo_url: nil),
        onBack: {}
    )
    .environmentObject(AppState())
}



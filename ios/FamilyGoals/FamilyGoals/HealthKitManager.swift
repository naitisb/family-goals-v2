//
//  HealthKitManager.swift
//  FamilyGoals
//
//  iOS HealthKit integration for step tracking
//

import Foundation
import HealthKit

class HealthKitManager: ObservableObject {
    let healthStore = HKHealthStore()
    @Published var isAuthorized = false

    init() {
        // Check authorization status on init
        checkAuthorizationStatus()
    }

    // Check if HealthKit is available on this device
    static func isHealthKitAvailable() -> Bool {
        return HKHealthStore.isHealthDataAvailable()
    }

    // Check current authorization status
    func checkAuthorizationStatus() {
        guard HKHealthStore.isHealthDataAvailable() else {
            isAuthorized = false
            return
        }

        let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount)!
        let status = healthStore.authorizationStatus(for: stepType)
        isAuthorized = (status == .sharingAuthorized)
    }

    // Request authorization to read step count and water, write water data
    func requestAuthorization() async throws {
        guard HKHealthStore.isHealthDataAvailable() else {
            throw HealthKitError.notAvailable
        }

        let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount)!
        let waterType = HKQuantityType.quantityType(forIdentifier: .dietaryWater)!

        let typesToRead: Set<HKObjectType> = [stepType, waterType]
        let typesToWrite: Set<HKSampleType> = [waterType]

        try await healthStore.requestAuthorization(toShare: typesToWrite, read: typesToRead)

        // Check if we actually got authorization
        let status = healthStore.authorizationStatus(for: stepType)
        await MainActor.run {
            self.isAuthorized = (status == .sharingAuthorized)
        }
    }

    // Fetch step count for a specific date
    func fetchSteps(for date: Date) async throws -> Int {
        let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount)!

        // Create predicate for the specified date
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        guard let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay) else {
            throw HealthKitError.invalidDate
        }

        let predicate = HKQuery.predicateForSamples(
            withStart: startOfDay,
            end: endOfDay,
            options: .strictStartDate
        )

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: stepType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { _, result, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                let sum = result?.sumQuantity()
                let steps = Int(sum?.doubleValue(for: HKUnit.count()) ?? 0)
                continuation.resume(returning: steps)
            }

            healthStore.execute(query)
        }
    }

    // Fetch step count for today
    func fetchTodaySteps() async throws -> Int {
        return try await fetchSteps(for: Date())
    }

    // Fetch water intake for a specific date (in milliliters)
    func fetchWater(for date: Date) async throws -> Double {
        let waterType = HKQuantityType.quantityType(forIdentifier: .dietaryWater)!

        // Create predicate for the specified date
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        guard let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay) else {
            throw HealthKitError.invalidDate
        }

        let predicate = HKQuery.predicateForSamples(
            withStart: startOfDay,
            end: endOfDay,
            options: .strictStartDate
        )

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: waterType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { _, result, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                let sum = result?.sumQuantity()
                // Convert liters to milliliters
                let waterML = (sum?.doubleValue(for: HKUnit.liter()) ?? 0) * 1000
                continuation.resume(returning: waterML)
            }

            healthStore.execute(query)
        }
    }

    // Fetch water intake for today (in milliliters)
    func fetchTodayWater() async throws -> Double {
        return try await fetchWater(for: Date())
    }

    // Save water intake to HealthKit (amount in milliliters)
    func saveWater(amountML: Double, date: Date = Date()) async throws {
        let waterType = HKQuantityType.quantityType(forIdentifier: .dietaryWater)!

        // Convert milliliters to liters
        let amountLiters = amountML / 1000.0
        let quantity = HKQuantity(unit: .liter(), doubleValue: amountLiters)

        let sample = HKQuantitySample(
            type: waterType,
            quantity: quantity,
            start: date,
            end: date
        )

        try await healthStore.save(sample)
    }
}

enum HealthKitError: Error {
    case notAvailable
    case notAuthorized
    case invalidDate
}

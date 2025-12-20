import { UserId } from '@domain/value-objects/UserId';
import { IFileRepository } from '@application/interfaces/IFileRepository';

export interface GetStorageStatsInput {
    userId?: string; // If provided, stats for specific user; otherwise, global stats
}

export interface GetStorageStatsOutput {
    totalFiles: number;
    totalSize: number; // bytes
    totalSizeGB: number; // gigabytes
    standardSize: number; // bytes
    standardSizeGB: number; // gigabytes
    archiveSize: number; // bytes
    archiveSizeGB: number; // gigabytes
    standardFiles: number;
    archiveFiles: number;
    // Cost estimates (monthly, USD)
    estimatedMonthlyCost: number;
    estimatedMonthlyCostStandard: number;
    estimatedMonthlyCostArchive: number;
    // Cost savings
    estimatedMonthlySavings: number; // Savings from using archive tier
    savingsPercentage: number; // Percentage saved
}

export class GetStorageStatsUseCase {
    // OCI Storage pricing (as of 2024, approximate)
    private readonly STANDARD_TIER_COST_PER_GB = 0.0305; // $0.0305 per GB/month
    private readonly ARCHIVE_TIER_COST_PER_GB = 0.0026; // $0.0026 per GB/month

    constructor(private readonly fileRepository: IFileRepository) {}

    async execute(input: GetStorageStatsInput = {}): Promise<GetStorageStatsOutput> {
        const ownerId = input.userId ? UserId.fromString(input.userId) : undefined;
        const stats = await this.fileRepository.getStorageStats(ownerId);

        // Convert bytes to GB
        const totalSizeGB = stats.totalSize / 1024 / 1024 / 1024;
        const standardSizeGB = stats.standardSize / 1024 / 1024 / 1024;
        const archiveSizeGB = stats.archiveSize / 1024 / 1024 / 1024;

        // Calculate costs
        const estimatedMonthlyCostStandard = standardSizeGB * this.STANDARD_TIER_COST_PER_GB;
        const estimatedMonthlyCostArchive = archiveSizeGB * this.ARCHIVE_TIER_COST_PER_GB;
        const estimatedMonthlyCost = estimatedMonthlyCostStandard + estimatedMonthlyCostArchive;

        // Calculate savings (if all archive files were in standard tier)
        const estimatedCostIfAllStandard = totalSizeGB * this.STANDARD_TIER_COST_PER_GB;
        const estimatedMonthlySavings = estimatedCostIfAllStandard - estimatedMonthlyCost;
        const savingsPercentage = totalSizeGB > 0
            ? (estimatedMonthlySavings / estimatedCostIfAllStandard) * 100
            : 0;

        return {
            totalFiles: stats.totalFiles,
            totalSize: stats.totalSize,
            totalSizeGB: parseFloat(totalSizeGB.toFixed(2)),
            standardSize: stats.standardSize,
            standardSizeGB: parseFloat(standardSizeGB.toFixed(2)),
            archiveSize: stats.archiveSize,
            archiveSizeGB: parseFloat(archiveSizeGB.toFixed(2)),
            standardFiles: stats.standardFiles,
            archiveFiles: stats.archiveFiles,
            estimatedMonthlyCost: parseFloat(estimatedMonthlyCost.toFixed(2)),
            estimatedMonthlyCostStandard: parseFloat(estimatedMonthlyCostStandard.toFixed(2)),
            estimatedMonthlyCostArchive: parseFloat(estimatedMonthlyCostArchive.toFixed(2)),
            estimatedMonthlySavings: parseFloat(estimatedMonthlySavings.toFixed(2)),
            savingsPercentage: parseFloat(savingsPercentage.toFixed(1)),
        };
    }
}


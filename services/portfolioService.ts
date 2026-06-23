import { ApiPortfolioRepository } from '../repositories/ApiPortfolioRepository';
import { IPortfolioRepository } from '../repositories/IPortfolioRepository';

// Export a singleton instance using the real API repository
export const portfolioService: IPortfolioRepository = new ApiPortfolioRepository();

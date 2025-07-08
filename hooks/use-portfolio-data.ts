import { getThemeByUsername } from "@/lib/actions/theme";
import { getPortfolioProjects } from "@/lib/data/project";
import type { GridType, PortfolioData } from "@/types/portfolio";

export async function getPortfolioData(
  username: string
): Promise<PortfolioData> {
  const [projectsResult, userTheme] = await Promise.all([
    getPortfolioProjects(username),
    getThemeByUsername(username),
  ]);

  const projects = projectsResult.success ? projectsResult.data : [];
  const gridType = (userTheme?.gridType as GridType) || "masonry";

  return {
    projects,
    gridType,
  };
}

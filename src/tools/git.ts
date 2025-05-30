import { z } from "zod";
import type { RegisterToolType } from "../type";

import { execCommand } from "../utils/execCommand";
import { getMdFile } from "../utils/getMdFile";

const getGitDiffResult = async (workingDirectory: string) => {
  const gitStagedDiff = await execCommand(
    "git diff --staged",
    workingDirectory
  );

  const useStaged = !!gitStagedDiff;
  const diffContent = useStaged
    ? gitStagedDiff
    : await execCommand("git diff", workingDirectory);
  const diffCommand = useStaged ? "git diff --staged" : "git diff";

  return [
    `Here is the result of \`${diffCommand}\`:`,
    "```diff",
    diffContent,
    "```",
    "Generate commit message:",
  ].join("\n");
};

export const registerGetCommitMessage: RegisterToolType = ({
  tool,
  result,
}) => {
  const schema = z.object({
    workingDirectory: z
      .string()
      .describe("The absolute path of the project root directory"),
  });

  tool({
    capability: "git",
    name: "generate_commit_message",
    description: "Generate standardized commit message",
    schema,
    handler: async ({ workingDirectory }) => {
      try {
        const mdFileContent = await getMdFile("git-commit-message.md");
        const gitDiffResult = await getGitDiffResult(workingDirectory);

        return result.addText(mdFileContent).addText(gitDiffResult);
      } catch (error) {
        return result.addError(error);
      }
    },
  });
};

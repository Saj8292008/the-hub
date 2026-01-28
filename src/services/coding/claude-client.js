const Anthropic = require('@anthropic-ai/sdk');

/**
 * Claude AI Client for code editing and generation
 */
class ClaudeClient {
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;

    if (!this.apiKey || this.apiKey === 'your-key') {
      console.warn('⚠️ ANTHROPIC_API_KEY not configured properly in .env');
    }

    this.client = new Anthropic({
      apiKey: this.apiKey
    });

    this.model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929';
    this.maxTokens = 4096;
    this.temperature = 0.3; // Deterministic for code edits
  }

  /**
   * Edit a file based on instructions
   * @param {string} filePath - Path to the file
   * @param {string} fileContent - Current file content
   * @param {string} instructions - User's edit instructions
   * @param {Array} contextFiles - Array of {path, content} for context
   * @returns {Promise<string>} - Updated file content
   */
  async editFile(filePath, fileContent, instructions, contextFiles = []) {
    const contextSection = contextFiles.length > 0
      ? '\n\nRelated context files:\n' + contextFiles.map(f =>
          `${f.path}:\n\`\`\`\n${f.content.slice(0, 2000)}\n\`\`\``
        ).join('\n\n')
      : '';

    const prompt = `You are a code assistant. Edit the following file according to the user's instructions.

Current file: ${filePath}
\`\`\`
${fileContent}
\`\`\`
${contextSection}

User instructions: ${instructions}

Respond with ONLY the complete updated file content, no explanations or markdown code fences. Start directly with the file content.`;

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = message.content[0].text;
      return content.trim();
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error(`Failed to edit file: ${error.message}`);
    }
  }

  /**
   * Create a new file based on instructions
   * @param {string} fileName - Name of the file to create
   * @param {string} instructions - User's creation instructions
   * @param {Array} contextFiles - Array of {path, content} for context
   * @returns {Promise<string>} - Generated file content
   */
  async createFile(fileName, instructions, contextFiles = []) {
    const contextSection = contextFiles.length > 0
      ? '\n\nRelated codebase files for context:\n' + contextFiles.map(f =>
          `${f.path}:\n\`\`\`\n${f.content.slice(0, 2000)}\n\`\`\``
        ).join('\n\n')
      : '';

    const prompt = `You are a code assistant. Create a new file according to the user's instructions.

File to create: ${fileName}
${contextSection}

User instructions: ${instructions}

Respond with ONLY the complete file content, no explanations or markdown code fences. Start directly with the file content.`;

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = message.content[0].text;
      return content.trim();
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error(`Failed to create file: ${error.message}`);
    }
  }

  /**
   * Answer a question about the codebase
   * @param {string} question - User's question
   * @param {Array} contextFiles - Array of {path, content} for context
   * @param {string} repoName - Repository name for context
   * @returns {Promise<string>} - Answer to the question
   */
  async answerQuestion(question, contextFiles = [], repoName = null) {
    const repoContext = repoName ? `Repository: ${repoName}\n\n` : '';

    const contextSection = contextFiles.length > 0
      ? 'Codebase context:\n' + contextFiles.map(f =>
          `${f.path}:\n\`\`\`\n${f.content.slice(0, 3000)}\n\`\`\``
        ).join('\n\n')
      : 'No specific files in context. Answer based on general programming knowledge.';

    const prompt = `You are a code assistant helping a developer understand their codebase.

${repoContext}${contextSection}

Question: ${question}

Provide a clear, concise answer. If you need more context to answer accurately, mention what additional files or information would be helpful.`;

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: 0.7, // More creative for answers
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = message.content[0].text;
      return content.trim();
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error(`Failed to answer question: ${error.message}`);
    }
  }

  /**
   * Generate a commit message based on diff
   * @param {string} diffContent - Git diff content
   * @returns {Promise<string>} - Suggested commit message
   */
  async generateCommitMessage(diffContent) {
    const prompt = `Generate a concise git commit message for these changes. Follow conventional commits format.

Diff:
\`\`\`
${diffContent.slice(0, 4000)}
\`\`\`

Respond with ONLY the commit message (subject line and optional body), no explanations.`;

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 200,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = message.content[0].text;
      return content.trim();
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error(`Failed to generate commit message: ${error.message}`);
    }
  }

  /**
   * Check if API is configured
   * @returns {boolean} - True if API key is set
   */
  isConfigured() {
    return this.apiKey && this.apiKey !== 'your-key';
  }
}

module.exports = ClaudeClient;

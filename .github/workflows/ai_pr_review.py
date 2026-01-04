import os
import requests
import openai

# Get OpenAI API key from environment
openai.api_key = os.getenv("OPENAI_API_KEY")

# Simple GitHub PR fetch
GITHUB_EVENT_PATH = os.getenv("GITHUB_EVENT_PATH")
import json

with open(GITHUB_EVENT_PATH) as f:
    event = json.load(f)

# Get PR details
pr_number = event["number"]
repo_name = event["repository"]["full_name"]

# Get PR diff
pr_diff_url = event["pull_request"]["diff_url"]
diff_resp = requests.get(pr_diff_url)
diff_text = diff_resp.text

# Prepare AI prompt
prompt = f"""
You are an AI code reviewer. Review the following GitHub Pull Request diff and suggest improvements, point out bugs, and recommend best practices. Do not write commits, just provide review comments:

{diff_text}
"""

# Call OpenAI API
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": prompt}],
    temperature=0.2
)

review_text = response.choices[0].message.content

# Print review for GitHub Actions logs
print("=== AI Review Start ===")
print(review_text)
print("=== AI Review End ===")

from __future__ import annotations

import json

from agent.agent import run_agent


def main() -> None:
    print("LandStack AI Agent")
    print("Use synthetic demonstration data only. Type 'exit' to quit.")

    while True:
        question = input("\nEnter your question: ").strip()
        if question.lower() in {"exit", "quit", "q"}:
            print("Goodbye.")
            break

        response = run_agent(question)
        print(json.dumps(response.model_dump(), indent=2))


if __name__ == "__main__":
    main()

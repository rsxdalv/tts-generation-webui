def split_by_lines(prompt: str):
    prompts = prompt.split("\n")
    prompts = [p.strip() for p in prompts]
    prompts = [p for p in prompts if len(p) > 0]
    return prompts


def split_by_length_simple(prompt: str):
    return [
        prompt[i:i + 200] for i in range(0, len(prompt), 200)]

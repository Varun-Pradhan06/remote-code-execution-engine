import re
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class CodePayload(BaseModel):
    code: str
    language: str

def analyze_cpp_complexity(code: str) -> str:
    """
    A lightweight static analysis tool to estimate Time Complexity.
    """
    # 1. Strip out comments so we don't accidentally count words inside them
    code = re.sub(r'//.*', '', code)
    code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
    
    # 2. Find all 'for' and 'while' loops
    loops = re.findall(r'\b(for|while)\b\s*\(', code)
    
    # 3. Estimate Big-O based on loop count
    # Note: A true AST would check if loops are nested vs sequential.
    # We are using a simplified heuristic for the scope of this sandbox.
    if len(loops) == 0:
        return "O(1)"
    elif len(loops) == 1:
        return "O(N)"
    elif len(loops) == 2:
        return "O(N^2)"
    else:
        return f"O(N^{len(loops)})"

@app.get("/")
def health_check():
    return {"status": "ML Worker is live"}

@app.post("/predict")
def predict_complexity(payload: CodePayload):
    # Pass the incoming code to our static analyzer
    predicted_complexity = analyze_cpp_complexity(payload.code)
    
    return {
        "complexity": predicted_complexity,
        "message": "Static analysis complete"
    }
import pdfplumber
import json
import re
import os

def extract_cosmetic_safety_data_v4(pdf_path):
    """
    Version 4: Aggressive filtering to remove non-ingredient data 
    (Countries, Concentrations, Colors, Functions).
    """
    results = []
    
    # Regex patterns to identify the start of specific lists
    PATTERNS = {
        "PROHIBITED": r"ANNEX\s+II.*LIST\s+OF\s+SUBSTANCES\s+WHICH\s+MUST\s+NOT",
        "RESTRICTED": r"ANNEX\s+III.*LIST\s+OF\s+SUBSTANCES\s+WHICH\s+COSMETIC\s+PRODUCTS\s+MUST\s+NOT\s+CONTAIN\s+EXCEPT",
        "PRESERVATIVE": r"ANNEX\s+VI.*LIST\s+OF\s+PRESERVATIVES",
        "UV_FILTER": r"ANNEX\s+VII.*LIST\s+OF\s+UV\s+FILTERS"
    }

    # --- AGGRESSIVE EXCLUSION LISTS ---
    
    # 1. Countries (Often appear in "National" columns)
    COUNTRIES = ["THAILAND", "SINGAPORE", "MALAYSIA", "INDONESIA", "PHILIPPINES", 
                 "VIETNAM", "BRUNEI", "CAMBODIA", "LAO", "MYANMAR", "ASEAN"]
    
    # 2. Colors (Often appear in Colorant lists)
    COLORS = ["RED", "BLUE", "YELLOW", "GREEN", "WHITE", "BLACK", "VIOLET", "ORANGE", "BROWN", "COLOUR", "COLOR"]
    
    # 3. Functions/Categories (Often appear in "Field of Application" column)
    FUNCTIONS = ["ANTISEPTIC", "DEODORANT", "PRESERVATIVE", "UV FILTER", "HAIR DYE", 
                 "TOOTHPASTE", "SHAMPOO", "SOAP", "MOUTHWASH", "SKIN CARE", "NAIL", 
                 "ORAL HYGIENE", "ANTIDANDRUFF", "ANTI-DANDRUFF", "HAIR WAVING", 
                 "DEPILATORIES", "OXIDIZING", "ALKALINE", "ACID", "SALTS", "ESTERS"]

    # 4. Junk/Headers
    JUNK = ["NUMBER", "REFERENCE", "SUBSTANCE", "MAXIMUM", "AUTHORIZED", "CONCENTRATION", 
            "CONDITIONS", "WARNINGS", "LIMITATIONS", "REQUIREMENTS", "ANNEX", "APPENDIX", "PART"]

    current_list_type = None
    print(f"Processing {pdf_path} with V4 logic...")

    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if not text: continue

            # Stop trigger
            if "LIST OF CONTACT POINT" in text:
                break

            # Detect Section
            for list_type, pattern in PATTERNS.items():
                if re.search(pattern, text, re.IGNORECASE | re.DOTALL):
                    current_list_type = list_type
                    print(f"--> Page {i+1}: Entered section {list_type}")
                    break
            
            if current_list_type:
                tables = page.extract_tables() # Default settings often work best for general layout
                
                for table in tables:
                    if not table: continue
                    for row in table:
                        # Clean row
                        clean_row = [str(cell).replace('\n', ' ').strip() if cell else "" for cell in row]
                        
                        # Get potential name based on list type
                        name_candidate = get_name_candidate(clean_row, current_list_type)
                        
                        if not name_candidate: continue

                        # --- VALIDATION CHECKS ---
                        upper_name = name_candidate.upper()

                        # Check 1: Is it a percentage/concentration? (e.g., "0.1%", "10%")
                        if re.search(r'\d+(\.\d+)?\s*%', name_candidate) or "PPM" in upper_name:
                            continue

                        # Check 2: Is it a known Country, Color, Function, or Junk word?
                        if any(x == upper_name for x in COUNTRIES) or \
                           any(x == upper_name for x in COLORS) or \
                           any(x == upper_name for x in FUNCTIONS) or \
                           any(x in upper_name for x in JUNK):
                            continue
                        
                        # Check 3: Length and Digits
                        # If name is too short or is just a number (e.g. "12")
                        if len(name_candidate) < 4 or name_candidate.isdigit():
                            continue
                        
                        # Check 4: Specific garbage patterns
                        if name_candidate.startswith("(") and name_candidate.endswith(")"): # Just a reference like "(1)"
                            continue

                        # Create Entry
                        item = {
                            "list_type": current_list_type,
                            "ingredient_name": name_candidate,
                            "risk": get_risk_level(current_list_type),
                            "details": get_details(clean_row, current_list_type)
                        }
                        results.append(item)

    return results

def get_name_candidate(row, list_type):
    """Selects the most likely column for the name based on Annex structure."""
    try:
        if list_type == "PROHIBITED":
            # Usually Col 1. If Col 1 is empty, check Col 0 (sometimes merged)
            if len(row) >= 2: return row[1] if row[1] else row[0]
        
        elif list_type == "RESTRICTED":
            # Usually Col 1
            if len(row) >= 2: return row[1]
            
        elif list_type == "PRESERVATIVE" or list_type == "UV_FILTER":
            # Usually Col 2 (Col 0=Colipa, Col 1=Ref, Col 2=Name)
            if len(row) >= 3: return row[2]
    except:
        pass
    return None

def get_risk_level(list_type):
    if list_type == "PROHIBITED": return "High (Banned)"
    if list_type == "RESTRICTED": return "Moderate (Restricted)"
    return "Low (Regulated)"

def get_details(row, list_type):
    # Simply joins the other columns as context
    return " | ".join([c for c in row if c and len(c) > 1])

if __name__ == "__main__":
    file_path = os.path.dirname(os.path.abspath(__file__))
    pdf_filename = os.path.join(file_path, "Technical Documents.pdf") 
    
    try:
        data = extract_cosmetic_safety_data_v4(pdf_filename)
        
        # Save
        output_filename = 'cosmetic_safety_data_final.json'
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        print(f"\nSuccess! Extracted {len(data)} validated ingredients.")
        print(f"Saved to {output_filename}")
        
    except Exception as e:
        print(f"Error: {e}")
import json
import sys
import re

def remove_extensions(obj):
    """
    Recursively remove 'extensions' fields from a nested dictionary or list.
    """
    if isinstance(obj, dict):
        # Remove 'extensions' key if it exists
        if 'extensions' in obj:
            del obj['extensions']
        
        # Recursively process all values
        for key, value in obj.items():
            remove_extensions(value)
    
    elif isinstance(obj, list):
        # Recursively process all items in the list
        for item in obj:
            remove_extensions(item)
    
    return obj

def resolve_token_references(obj, root_data):
    """
    Recursively resolve token references like {variables.colors.neutral.white}
    """
    if isinstance(obj, dict):
        for key, value in obj.items():
            obj[key] = resolve_token_references(value, root_data)
    elif isinstance(obj, list):
        return [resolve_token_references(item, root_data) for item in obj]
    elif isinstance(obj, str):
        # Check if this is a reference pattern
        if obj.startswith('{') and obj.endswith('}'):
            reference = obj[1:-1]  # Remove { }
            parts = reference.split('.')
            
            # Navigate through the data structure
            current = root_data
            try:
                for part in parts:
                    current = current[part]
                
                # If we found a token object, return its value
                if isinstance(current, dict) and 'value' in current:
                    return current['value']
                return current
            except (KeyError, TypeError):
                # If reference can't be resolved, return original
                return obj
    
    return obj

def validate_token_structure(data):
    """
    Validate that the token structure matches the expected format.
    Expected sections: font, variables, color tokens
    """
    required_sections = ['font', 'variables', 'color tokens']
    found_sections = []
    
    for section in required_sections:
        if section in data:
            found_sections.append(section)
    
    return found_sections

def extract_css_variables(data, prefix='--'):
    """
    Extract CSS custom properties from the token structure.
    """
    css_vars = {}
    
    def process_tokens(obj, path=''):
        if isinstance(obj, dict):
            if 'type' in obj and 'value' in obj:
                # This is a token definition
                var_name = prefix + path.replace('.', '-')
                css_vars[var_name] = obj['value']
            else:
                for key, value in obj.items():
                    new_path = f"{path}.{key}" if path else key
                    process_tokens(value, new_path)
    
    process_tokens(data)
    return css_vars

def clean_token_file(input_file, output_file, resolve_refs=False):
    """
    Read a design tokens JSON file, remove all 'extensions' fields,
    and write the cleaned version to a new file.
    
    Args:
        input_file: Path to the input JSON file
        output_file: Path to the output JSON file
        resolve_refs: If True, resolve token references like {variables.colors.neutral.white}
    """
    try:
        # Read the input file
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Validate structure
        found_sections = validate_token_structure(data)
        print(f"📊 Found sections: {', '.join(found_sections)}")
        
        # Remove extensions
        cleaned_data = remove_extensions(data)
        
        # Optionally resolve references
        if resolve_refs:
            print("🔗 Resolving token references...")
            cleaned_data = resolve_token_references(cleaned_data, cleaned_data)
        
        # Write to output file with pretty formatting
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(cleaned_data, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Successfully cleaned tokens!")
        print(f"  Input:  {input_file}")
        print(f"  Output: {output_file}")
        
        # Print statistics
        if 'variables' in cleaned_data:
            colors = cleaned_data['variables'].get('colors', {})
            color_count = sum(len(v) for v in colors.values() if isinstance(v, dict))
            print(f"  Colors: {color_count} tokens")
        
        if 'font' in cleaned_data:
            font_count = len(cleaned_data['font'])
            print(f"  Fonts:  {font_count} styles")
        
        if 'color tokens' in cleaned_data:
            semantic_count = sum(
                len(str(v)) for v in str(cleaned_data['color tokens']).split('type')
            ) // 10  # Rough estimate
            print(f"  Semantic tokens: ~{semantic_count}")
        
    except FileNotFoundError:
        print(f"✗ Error: File '{input_file}' not found!")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"✗ Error: '{input_file}' is not a valid JSON file!")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        sys.exit(1)

def generate_css_file(input_file, output_file):
    """
    Generate a CSS file with custom properties from the design tokens.
    """
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        css_vars = extract_css_variables(data)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("/* Generated from design tokens */\n")
            f.write(":root {\n")
            for var_name, value in sorted(css_vars.items()):
                f.write(f"  {var_name}: {value};\n")
            f.write("}\n")
        
        print(f"✓ Successfully generated CSS!")
        print(f"  Output: {output_file}")
        print(f"  Variables: {len(css_vars)}")
        
    except Exception as e:
        print(f"✗ Error generating CSS: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    # Configuration
    input_filename = "design-tokens.tokens (5).json"
    output_filename = "design-tokens-cleaned.json"
    
    # Command line arguments
    # Usage: python remove-extensions.py [input] [output] [--resolve-refs] [--css output.css]
    resolve_refs = False
    generate_css = False
    css_output = None
    
    if len(sys.argv) > 1:
        args = sys.argv[1:]
        
        # Check for flags
        if '--resolve-refs' in args:
            resolve_refs = True
            args.remove('--resolve-refs')
        
        if '--css' in args:
            generate_css = True
            css_idx = args.index('--css')
            if css_idx + 1 < len(args):
                css_output = args[css_idx + 1]
                args.pop(css_idx)  # Remove --css
                args.pop(css_idx)  # Remove the filename
            else:
                print("✗ Error: --css flag requires an output filename")
                sys.exit(1)
        
        # Remaining args are input/output files
        if len(args) > 0:
            input_filename = args[0]
        if len(args) > 1:
            output_filename = args[1]
    
    # Clean the token file
    clean_token_file(input_filename, output_filename, resolve_refs)
    
    # Optionally generate CSS
    if generate_css and css_output:
        generate_css_file(output_filename, css_output)

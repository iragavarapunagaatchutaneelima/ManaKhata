import os
import re

directory = 'src/main/java/com/manaKhata'
for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('.java'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            if '@Entity' in content and 'hibernateLazyInitializer' not in content:
                print('Fixing:', filepath)
                content = re.sub(r'(public class [A-Z])', r'@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})\n\1', content)
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

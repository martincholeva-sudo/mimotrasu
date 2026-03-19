import os

plausible_code = '''<script defer data-domain="mimotrasu.cz" src="https://plausible.io/js/script.js"></script>'''

def insert_plausible_script(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    if plausible_code in content:
        print(f"✔️  Already present: {file_path}")
        return

    if '</head>' in content:
        content = content.replace('</head>', plausible_code + '\n</head>')
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"✅ Inserted: {file_path}")
    else:
        print(f"⚠️  Missing </head>: {file_path}")

def main():
    root = "./www"
    for subdir, _, files in os.walk(root):
        for file in files:
            if file.endswith(".html"):
                insert_plausible_script(os.path.join(subdir, file))

if __name__ == "__main__":
    main()

class MiBasic:
    def __init__(self):
        self.keywords = {}
        self.location = 0
        self.vars = {}
        self.script = []
        self.running = False
        self.is_loaded = False
        
        # Callbacks par défaut
        self.show_txt = lambda text: print(f"Text: {text}")
        self.choice = lambda type, options: 0
        self.open_door = lambda door: None
        self.get_object = lambda obj: None

    async def init(self, script_path):
        # Chargement synchrone du script
        with open(script_path, 'r') as f:
            script = f.read()
        
        self.script = script.split('\n')
        self.script.insert(0, ':STOP')
        self.script.insert(0, '#STOP')
        self._scan_script()
        self.is_loaded = True

    def _scan_script(self):
        for i, line in enumerate(self.script):
            line = line.strip()
            if line.startswith(':'):
                label = line[1:]
                self.keywords[label] = i

    def go_to(self, key):
        label = self._get_val(key)
        if label in self.keywords:
            self.location = self.keywords[label]

    def _split_line(self, line, sep=':'):
        parts = line[1:].split(sep)
        command = parts[0].lower()
        return parts, command

    def _get_val(self, code):
        code = str(code).strip()
        if code.startswith('#'):
            parts, cmd = self._split_line(code, '-')
            if cmd == 'var':
                val = self.vars.get(parts[1], '')
                try:
                    return int(val)
                except:
                    return val
            elif cmd == 'js':
                return eval(parts[1])
        return code

    def _read_line(self):
        self.location += 1
        if self.location < len(self.script):
            return self.script[self.location].strip()
        return ""

    def run(self, from_line=None):
        if from_line is None:
            from_line = self.location
        if isinstance(from_line, str):
            self.go_to(from_line)
        else:
            self.location = from_line

        self.running = True
        while self.running:
            if self.location >= len(self.script):
                print("End of script reached.")
                self.running = False
                return

            line = self._read_line()

            if line.startswith(':'):
                continue

            if line.startswith('#'):
                parts, command = self._split_line(line)
                
                if command == '':
                    # Menu de choix
                    choice_type = parts[1]
                    options = []
                    next_line = self._read_line()
                    while next_line and not next_line.startswith('#'):
                        options.append(next_line.split(':', 1))
                        next_line = self._read_line()
                    
                    # Reculer d'une ligne après lecture
                    self.location -= 1
                    
                    result_id = self.choice(choice_type, options)
                    self.go_to(result_id)
                
                elif command == 'stop':
                    self.running = False
                
                elif command == 'open':
                    self.open_door(self._get_val(parts[1]))
                
                elif command == 'get':
                    self.get_object(self._get_val(parts[1]))
                
                elif command == 'set':
                    val = self._get_val(parts[2])
                    if val == '':
                        val = True
                    self.vars[parts[1]] = val
                
                elif command == 'if':
                    var1 = self._get_val(parts[1])
                    var2 = parts[2]
                    if var2 == '':
                        var2 = True
                    else:
                        var2 = self._get_val(var2)
                    goto_label = parts[3]
                    if var1 == var2:
                        self.go_to(goto_label)
                
                elif command == 'goto':
                    self.go_to(parts[1])
                
                else:
                    print(f"miB: {self._get_val('#' + command)}")
                continue

            # Texte normal
            self.show_txt(line)

def mi_b_example():
    mb = MiBasic()
    
    # Définition des callbacks
    mb.show_txt = lambda text: print(f"Text: {text}")
    
    def choice_callback(choice_type, options):
        print(f"Choice Type: {choice_type}")
        print("Options:")
        for opt in options:
            print(f"{opt[0]}: {opt[1]}")
        return input("Enter choice ID: ")
    
    mb.choice = choice_callback
    mb.open_door = lambda door: print(f"Door opened: {door}")
    mb.get_object = lambda obj: print(f"Object obtained: {obj}")
    
    # Exemple d'utilisation
    mb.script = [
        '#STOP',
        ':STOP',
        ':START',
        'Welcome to the adventure!',
        '#:menu',
        'Go left:room1',
        'Go right:room2',
        '#',
        ':room1',
        'You entered room 1',
        '#stop',
        ':room2',
        'You entered room 2',
        '#stop'
    ]
    mb._scan_script()
    mb.run(':START')

print('LeCacaEstCuit')
MiBasicReaderJSLoaded = True

# Test
if __name__ == '__main__':
    mi_b_example()
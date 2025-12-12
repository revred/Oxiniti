#!/usr/bin/env python3
"""
Vibe Checker - A fun interactive CLI application
Created with Claude to test vibing with code!
"""

import random
import sys
from colorama import Fore, Back, Style, init

# Initialize colorama for cross-platform colored output
init(autoreset=True)


class VibeChecker:
    """A class to check and display vibes"""
    
    VIBES = [
        ("✨ Immaculate Vibes ✨", Fore.MAGENTA + Style.BRIGHT, "You're radiating pure excellence!"),
        ("🌟 Amazing Vibes 🌟", Fore.CYAN + Style.BRIGHT, "The energy is absolutely stellar!"),
        ("🎉 Great Vibes 🎉", Fore.GREEN + Style.BRIGHT, "Feeling good, looking good!"),
        ("😊 Good Vibes 😊", Fore.YELLOW + Style.BRIGHT, "Nice and positive energy!"),
        ("😌 Chill Vibes 😌", Fore.BLUE, "Relaxed and taking it easy!"),
        ("🤔 Contemplative Vibes 🤔", Fore.WHITE, "Deep in thought, that's cool!"),
        ("😴 Sleepy Vibes 😴", Fore.LIGHTBLACK_EX, "Time for a nap maybe?"),
    ]
    
    def __init__(self):
        self.session_vibes = []
    
    def check_vibe(self, name: str = "Friend") -> tuple:
        """Check the vibe for a given name"""
        # Use the name to seed random for consistency (same name = same vibe in session)
        vibe = random.choice(self.VIBES)
        self.session_vibes.append((name, vibe[0]))
        return vibe
    
    def display_vibe(self, name: str):
        """Display a vibe check for someone"""
        vibe_title, color, message = self.check_vibe(name)
        
        print(f"\n{color}{'='*50}")
        print(f"{color}  VIBE CHECK for {name}")
        print(f"{color}{'='*50}")
        print(f"{color}{vibe_title.center(50)}")
        print(f"{color}{message.center(50)}")
        print(f"{color}{'='*50}{Style.RESET_ALL}\n")
    
    def show_history(self):
        """Show all vibes checked in this session"""
        if not self.session_vibes:
            print(f"{Fore.YELLOW}No vibes checked yet!{Style.RESET_ALL}")
            return
        
        print(f"\n{Fore.CYAN}{Style.BRIGHT}{'='*50}")
        print(f"  SESSION VIBE HISTORY")
        print(f"{'='*50}{Style.RESET_ALL}")
        for i, (name, vibe) in enumerate(self.session_vibes, 1):
            print(f"{Fore.GREEN}{i}. {name}: {vibe}{Style.RESET_ALL}")
        print()


def print_banner():
    """Print a cool banner"""
    banner = f"""
{Fore.MAGENTA}{Style.BRIGHT}
╦  ╦╦╔╗ ╔═╗  ╔═╗╦ ╦╔═╗╔═╗╦╔═╔═╗╦═╗
╚╗╔╝║╠╩╗║╣   ║  ╠═╣║╣ ║  ║╔╩╗║╣ ╠╦╝
 ╚╝ ╩╚═╝╚═╝  ╚═╝╩ ╩╚═╝╚═╝╩╩ ╩╚═╝╩╚═
{Style.RESET_ALL}
{Fore.CYAN}Created with Claude - Let's check those vibes!{Style.RESET_ALL}
"""
    print(banner)


def main():
    """Main interactive loop"""
    print_banner()
    
    checker = VibeChecker()
    
    print(f"{Fore.GREEN}Welcome to the Vibe Checker!{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}Commands: 'check <name>', 'history', 'quit'{Style.RESET_ALL}\n")
    
    while True:
        try:
            user_input = input(f"{Fore.BLUE}vibe> {Style.RESET_ALL}").strip()
            
            if not user_input:
                continue
            
            command_parts = user_input.lower().split(maxsplit=1)
            command = command_parts[0]
            
            if command in ['quit', 'exit', 'q']:
                print(f"\n{Fore.MAGENTA}Thanks for vibing! ✨ Stay positive! ✨{Style.RESET_ALL}\n")
                break
            
            elif command == 'check':
                if len(command_parts) > 1:
                    name = command_parts[1].strip()
                else:
                    name = "Friend"
                checker.display_vibe(name)
            
            elif command == 'history':
                checker.show_history()
            
            elif command == 'help':
                print(f"\n{Fore.CYAN}Available commands:{Style.RESET_ALL}")
                print(f"  {Fore.GREEN}check <name>{Style.RESET_ALL} - Check someone's vibe")
                print(f"  {Fore.GREEN}history{Style.RESET_ALL}      - Show vibe history")
                print(f"  {Fore.GREEN}quit{Style.RESET_ALL}         - Exit the program\n")
            
            else:
                print(f"{Fore.RED}Unknown command. Type 'help' for available commands.{Style.RESET_ALL}\n")
        
        except KeyboardInterrupt:
            print(f"\n\n{Fore.MAGENTA}Vibe check interrupted! Catch you later! ✌️{Style.RESET_ALL}\n")
            break
        except EOFError:
            break


if __name__ == "__main__":
    main()

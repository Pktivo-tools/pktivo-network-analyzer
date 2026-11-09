import windows from '@/assets/releases/Netpack-0.2.0-win32-x64.zip.asset.json';
import macArm from '@/assets/releases/Netpack-0.2.0-darwin-arm64.zip.asset.json';
import macIntel from '@/assets/releases/Netpack-0.2.0-darwin-x64.zip.asset.json';
import debian from '@/assets/releases/netpack_0.2.0_amd64.deb.asset.json';
import arch from '@/assets/releases/netpack-0.2.0-1-x86_64.pkg.tar.zst.asset.json';
export const RELEASE_VERSION='0.2.0';
export interface Step { text: string; command?: string }
const macInstall:Step[]=[
  {text:'Double-click the downloaded ZIP to extract it.'},
  {text:'Drag Netpack.app into your Applications folder.'},
  {text:'Open Netpack. If macOS says it cannot be opened, go to System Settings → Privacy & Security and click “Open Anyway”. Only do this if you trust this unsigned preview.'},
];
const macCapture:Step[]=[
  {text:'Download Wireshark for macOS from wireshark.org (pick the same chip type: Apple Silicon or Intel) and open the .dmg file. Alternatively, with Homebrew:',command:'brew install --cask wireshark'},
  {text:'In the Wireshark disk image, run “Install ChmodBPF.pkg”. This lets your user record network traffic without admin rights.'},
  {text:'Also run “Add Wireshark to the system path.pkg” so Netpack can find the dumpcap capture tool (Homebrew does this automatically).'},
  {text:'Restart your Mac, then check that dumpcap works. It should list your network connections:',command:'dumpcap -D'},
];
export const RELEASES=[
  {id:'windows',platform:'Windows',variant:'Windows 10 / 11 · x64',format:'Portable ZIP',asset:windows,
    install:[{text:'Right-click the ZIP and choose “Extract All…”. Extract the whole folder — don’t run it from inside the ZIP.'},{text:'Open the extracted folder and double-click Netpack.exe.'},{text:'Windows may show “Windows protected your PC” because this preview is unsigned. Click “More info” → “Run anyway” only if you trust it.'}] as Step[],
    capture:[{text:'Download the Wireshark Windows x64 installer from wireshark.org and run it.'},{text:'Keep the default components selected — Netpack needs “Dumpcap”, which is part of Wireshark. Keep the default install folder (C:\\Program Files\\Wireshark).'},{text:'When asked, install Npcap (the capture driver). In the Npcap setup, leave “Restrict Npcap driver’s access to Administrators only” unchecked.'},{text:'Restart Windows, then open Netpack and click Capture. Your network adapters should appear in the list.'}] as Step[]},
  {id:'mac-arm',platform:'macOS',variant:'Apple Silicon · M1 and newer',format:'App ZIP',asset:macArm,install:macInstall,capture:macCapture},
  {id:'mac-intel',platform:'macOS',variant:'Intel · x64',format:'App ZIP',asset:macIntel,install:macInstall,capture:macCapture},
  {id:'debian',platform:'Debian / Ubuntu',variant:'Debian, Ubuntu, Mint and derivatives · AMD64',format:'.deb package',asset:debian,
    install:[{text:'Save the package in your Downloads folder.'},{text:'Open a terminal in Downloads and install it (apt also installs the required system libraries):',command:'sudo apt install ./netpack_0.2.0_amd64.deb'},{text:'Start Netpack from your app menu. Don’t run it with sudo or as root.'}] as Step[],
    capture:[{text:'Install the Wireshark capture tool package (it contains dumpcap):',command:'sudo apt install wireshark-common'},{text:'When asked “Should non-superusers be able to capture packets?”, choose Yes. If you missed it, run:',command:'sudo dpkg-reconfigure wireshark-common'},{text:'Add your user to the wireshark group:',command:'sudo usermod -aG wireshark $USER'},{text:'Log out and back in (or restart), then check that it lists your network connections without sudo:',command:'dumpcap -D'}] as Step[]},
  {id:'arch',platform:'Arch Linux',variant:'Arch, Manjaro, EndeavourOS · x86_64',format:'Pacman package',asset:arch,
    install:[{text:'Save the package in your Downloads folder.'},{text:'Open a terminal in Downloads and install it:',command:'sudo pacman -U ./netpack-0.2.0-1-x86_64.pkg.tar.zst'},{text:'Start Netpack from your app menu. Don’t run it with sudo or as root.'}] as Step[],
    capture:[{text:'Install the command-line Wireshark package (it contains dumpcap). You don’t need the full Wireshark window app:',command:'sudo pacman -S wireshark-cli'},{text:'Add your user to the wireshark group, which is allowed to capture:',command:'sudo usermod -aG wireshark $USER'},{text:'Log out and back in (or restart), then check that it lists your network connections without sudo:',command:'dumpcap -D'}] as Step[]},
] as const;

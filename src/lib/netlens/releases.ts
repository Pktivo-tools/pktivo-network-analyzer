import windows from '@/assets/releases/Netpack-0.2.0-win32-x64.zip.asset.json';
import macArm from '@/assets/releases/Netpack-0.2.0-darwin-arm64.zip.asset.json';
import macIntel from '@/assets/releases/Netpack-0.2.0-darwin-x64.zip.asset.json';
import debian from '@/assets/releases/netpack_0.2.0_amd64.deb.asset.json';
import arch from '@/assets/releases/netpack-0.2.0-1-x86_64.pkg.tar.zst.asset.json';
export const RELEASE_VERSION='0.2.0';
export const RELEASES=[
  {id:'windows',platform:'Windows',variant:'Windows 10 / 11 · x64',format:'Portable ZIP',asset:windows,steps:['Extract the whole ZIP to a folder.','Open Netpack.exe. This unsigned preview may show a Windows security warning.'],command:null},
  {id:'mac-arm',platform:'macOS',variant:'Apple Silicon · M1 and newer',format:'App ZIP',asset:macArm,steps:['Extract the ZIP and move Netpack.app into Applications.','This app is unsigned and not notarized. macOS may block it; only approve it if you trust this preview.'],command:null},
  {id:'mac-intel',platform:'macOS',variant:'Intel · x64',format:'App ZIP',asset:macIntel,steps:['Extract the ZIP and move Netpack.app into Applications.','This app is unsigned and not notarized. macOS may block it; only approve it if you trust this preview.'],command:null},
  {id:'debian',platform:'Debian / Ubuntu',variant:'Debian, Ubuntu, Mint and derivatives · AMD64',format:'.deb package',asset:debian,steps:['Save the package in Downloads.','Open a terminal in Downloads and run the command below. Start Netpack from your app menu.'],command:'sudo apt install ./netpack_0.2.0_amd64.deb'},
  {id:'arch',platform:'Arch Linux',variant:'Arch and derivatives · x86_64',format:'Pacman package',asset:arch,steps:['Save the package in Downloads.','Open a terminal in Downloads and run the command below. Start Netpack from your app menu.'],command:'sudo pacman -U ./netpack-0.2.0-1-x86_64.pkg.tar.zst'},
] as const;
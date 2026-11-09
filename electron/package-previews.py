"""Build distribution archives from refreshed Packager directories (no privileged install scripts)."""
import argparse, hashlib, json, os, shutil, subprocess, tarfile, tempfile, zipfile
from pathlib import Path
parser=argparse.ArgumentParser()
parser.add_argument('--input',required=True);parser.add_argument('--output',required=True);parser.add_argument('--version',required=True)
args=parser.parse_args();source=Path(args.input);out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
version=args.version
for platform in ['win32-x64','darwin-x64','darwin-arm64','linux-x64']:
    folder=source/f'Pktivo-{platform}'
    if not folder.is_dir():raise RuntimeError(f'Missing packaged app: {folder}')
    if platform=='linux-x64':continue
    filename=f'Pktivo-{version}-{platform}.zip'
    destination=out/filename
    if destination.exists():destination.unlink()
    # Preserve macOS framework symlinks instead of duplicating their targets.
    subprocess.run(['zip','-q','-r','-y','-3',str(destination),folder.name,'-x','*/.git/*','*/.git'],cwd=source,check=True)
with tarfile.open(out/f'Pktivo-{version}-linux-x64.tar.gz','w:gz',compresslevel=3) as archive:
    archive.add(source/'Pktivo-linux-x64',arcname='Pktivo-linux-x64')
with tempfile.TemporaryDirectory(prefix='pktivo-packages-') as temporary:
    temp=Path(temporary);root=temp/'root';app=root/'opt/pktivo';app.parent.mkdir(parents=True)
    shutil.copytree(source/'Pktivo-linux-x64',app,symlinks=True)
    # Chromium's setuid helper requires this standard mode on installed system packages.
    sandbox=app/'chrome-sandbox'
    if sandbox.exists():sandbox.chmod(0o4755)
    desktop=root/'usr/share/applications/pktivo.desktop';desktop.parent.mkdir(parents=True)
    desktop.write_text('[Desktop Entry]\nName=Pktivo\nComment=Network packet analyzer\nExec=/opt/pktivo/Pktivo %F\nIcon=/opt/pktivo/resources/app/electron/icons/pktivo.png\nType=Application\nCategories=Network;\nTerminal=false\n')
    control=temp/'control';control.mkdir()
    size=sum(p.stat().st_size for p in root.rglob('*') if p.is_file())//1024
    (control/'control').write_text(f'Package: pktivo\nVersion: {version}\nArchitecture: amd64\nMaintainer: Pktivo release maintainer\nSection: net\nPriority: optional\nInstalled-Size: {size}\nDepends: libgtk-3-0, libnss3, libatk-bridge2.0-0, libdrm2, libxkbcommon0, libxcomposite1, libxdamage1, libxfixes3, libxrandr2, libgbm1, libasound2 | libasound2t64\nRecommends: wireshark-common\nDescription: Beginner-friendly local network packet analyzer\n Inspect saved captures offline and record traffic using installed capture tools.\n')
    # dpkg rejects PAX headers (Python's default), so use GNU tar with root ownership.
    def owned(info):
        info.uid=info.gid=0;info.uname=info.gname='root';return info
    def pack(path,directory,mode):
        with tarfile.open(path,mode,format=tarfile.GNU_FORMAT) as archive:
            for child in directory.iterdir():archive.add(child,arcname='./'+child.name,filter=owned)
    (temp/'debian-binary').write_text('2.0\n');pack(temp/'control.tar.gz',control,'w:gz');pack(temp/'data.tar.xz',root,'w:xz')
    subprocess.run(['ar','rc',str(out/f'pktivo_{version}_amd64.deb'),'debian-binary','control.tar.gz','data.tar.xz'],cwd=temp,check=True)
    (root/'.PKGINFO').write_text(f'pkgname = pktivo\npkgbase = pktivo\npkgver = {version}-1\npkgdesc = Beginner-friendly local network packet analyzer\nsize = {size*1024}\narch = x86_64\nlicense = LicenseRef-Pktivo-preview\ndepend = gtk3\ndepend = nss\ndepend = alsa-lib\ndepend = libxss\ndepend = libxtst\ndepend = libnotify\ndepend = libdrm\ndepend = mesa\noptdepend = wireshark-cli: live packet capture\n')
    pack(temp/'arch.tar',root,'w')
    subprocess.run(['zstd','-q','-T0',str(temp/'arch.tar'),'-o',str(out/f'pktivo-{version}-1-x86_64.pkg.tar.zst')],check=True)
manifest=[]
for path in sorted(out.iterdir()):
    if path.name in ['checksums.txt','manifest.json'] or not path.is_file():continue
    digest=hashlib.sha256(path.read_bytes()).hexdigest();manifest.append({'filename':path.name,'size':path.stat().st_size,'sha256':digest})
(out/'checksums.txt').write_text(''.join(f"{item['sha256']}  {item['filename']}\n" for item in manifest))
(out/'manifest.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps(manifest,indent=2))
"""Build distribution archives from refreshed Packager directories (no privileged install scripts)."""
import argparse, hashlib, json, os, shutil, subprocess, tarfile, tempfile, zipfile
from pathlib import Path
parser=argparse.ArgumentParser()
parser.add_argument('--input',required=True);parser.add_argument('--output',required=True);parser.add_argument('--version',required=True)
args=parser.parse_args();source=Path(args.input);out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
version=args.version
for platform in ['win32-x64','darwin-x64','darwin-arm64','linux-x64']:
    folder=source/f'Netlens-{platform}'
    if not folder.is_dir():raise RuntimeError(f'Missing packaged app: {folder}')
    if platform=='linux-x64':continue
    filename=f'Netlens-{version}-{platform}.zip'
    with zipfile.ZipFile(out/filename,'w',zipfile.ZIP_DEFLATED,compresslevel=3) as archive:
        for root,dirs,files in os.walk(folder):
            dirs[:]=[d for d in dirs if d!='.git']
            for name in files:
                path=Path(root)/name
                if name=='.git':continue
                archive.write(path,path.relative_to(source))
with tarfile.open(out/f'Netlens-{version}-linux-x64.tar.gz','w:gz',compresslevel=3) as archive:
    archive.add(source/'Netlens-linux-x64',arcname='Netlens-linux-x64')
with tempfile.TemporaryDirectory(prefix='netlens-packages-') as temporary:
    temp=Path(temporary);root=temp/'root';app=root/'opt/netlens';app.parent.mkdir(parents=True)
    shutil.copytree(source/'Netlens-linux-x64',app,symlinks=True)
    # Chromium's setuid helper requires this standard mode on installed system packages.
    sandbox=app/'chrome-sandbox'
    if sandbox.exists():sandbox.chmod(0o4755)
    desktop=root/'usr/share/applications/netlens.desktop';desktop.parent.mkdir(parents=True)
    desktop.write_text('[Desktop Entry]\nName=Netlens\nComment=Network packet analyzer\nExec=/opt/netlens/Netlens %F\nType=Application\nCategories=Network;\nTerminal=false\n')
    control=temp/'control';control.mkdir()
    size=sum(p.stat().st_size for p in root.rglob('*') if p.is_file())//1024
    (control/'control').write_text(f'Package: netlens\nVersion: {version}\nArchitecture: amd64\nMaintainer: Netlens release maintainer\nSection: net\nPriority: optional\nInstalled-Size: {size}\nDepends: libgtk-3-0, libnss3, libatk-bridge2.0-0, libdrm2, libxkbcommon0, libxcomposite1, libxdamage1, libxfixes3, libxrandr2, libgbm1, libasound2 | libasound2t64\nRecommends: wireshark-common\nDescription: Beginner-friendly local network packet analyzer\n Inspect saved captures offline and record traffic using installed capture tools.\n')
    def pack(path,directory,mode):
        with tarfile.open(path,mode) as archive:
            for child in directory.iterdir():archive.add(child,arcname=child.name)
    (temp/'debian-binary').write_text('2.0\n');pack(temp/'control.tar.gz',control,'w:gz');pack(temp/'data.tar.xz',root,'w:xz')
    subprocess.run(['ar','rc',str(out/f'netlens_{version}_amd64.deb'),'debian-binary','control.tar.gz','data.tar.xz'],cwd=temp,check=True)
    (root/'.PKGINFO').write_text(f'pkgname = netlens\npkgbase = netlens\npkgver = {version}-1\npkgdesc = Beginner-friendly local network packet analyzer\nsize = {size*1024}\narch = x86_64\nlicense = LicenseRef-Netlens-preview\ndepend = gtk3\ndepend = nss\ndepend = alsa-lib\ndepend = libxss\ndepend = libxtst\ndepend = libnotify\ndepend = libdrm\ndepend = mesa\noptdepend = wireshark-cli: live packet capture\n')
    pack(temp/'arch.tar',root,'w')
    subprocess.run(['zstd','-q','-T0',str(temp/'arch.tar'),'-o',str(out/f'netlens-{version}-1-x86_64.pkg.tar.zst')],check=True)
manifest=[]
for path in sorted(out.iterdir()):
    if path.name in ['checksums.txt','manifest.json'] or not path.is_file():continue
    digest=hashlib.sha256(path.read_bytes()).hexdigest();manifest.append({'filename':path.name,'size':path.stat().st_size,'sha256':digest})
(out/'checksums.txt').write_text(''.join(f"{item['sha256']}  {item['filename']}\n" for item in manifest))
(out/'manifest.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps(manifest,indent=2))
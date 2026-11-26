export const demoScanBefore = `<?xml version="1.0"?><nmaprun scanner="nmap" args="nmap -sS -sV -O -oX lab-monday.xml 192.168.1.0/24" startstr="Mon Nov 23 09:00:00 2026" version="7.95"><scaninfo type="syn" protocol="tcp"/>
<host><status state="up"/><address addr="192.168.1.1" addrtype="ipv4"/><address addr="A4:2B:B0:11:22:33" addrtype="mac" vendor="TP-Link"/><hostnames><hostname name="router.lan"/></hostnames><ports>
<port protocol="tcp" portid="53"><state state="open" reason="syn-ack"/><service name="domain" product="dnsmasq" version="2.89"/></port>
<port protocol="tcp" portid="80"><state state="open" reason="syn-ack"/><service name="http" product="lighttpd" version="1.4.59"/><script id="http-title" output="Router login"/></port>
<port protocol="tcp" portid="443"><state state="open" reason="syn-ack"/><service name="https" product="lighttpd" version="1.4.59"/></port></ports><os><osmatch name="Linux 4.15 - 5.19" accuracy="96"/></os></host>
<host><status state="up"/><address addr="192.168.1.20" addrtype="ipv4"/><address addr="3C:22:FB:44:55:66" addrtype="mac" vendor="Apple"/><hostnames><hostname name="macbook.lan"/></hostnames><ports>
<port protocol="tcp" portid="22"><state state="open" reason="syn-ack"/><service name="ssh" product="OpenSSH" version="9.6"/></port>
<port protocol="tcp" portid="5000"><state state="filtered" reason="no-response"/><service name="upnp"/></port></ports><os><osmatch name="Apple macOS 14" accuracy="91"/></os></host>
<host><status state="up"/><address addr="192.168.1.35" addrtype="ipv4"/><address addr="00:11:32:77:88:99" addrtype="mac" vendor="Synology"/><hostnames><hostname name="nas.lan"/></hostnames><ports>
<port protocol="tcp" portid="139"><state state="open" reason="syn-ack"/><service name="netbios-ssn" product="Samba smbd" version="4"/></port>
<port protocol="tcp" portid="445"><state state="open" reason="syn-ack"/><service name="microsoft-ds" product="Samba smbd" version="4"/></port>
<port protocol="tcp" portid="5001"><state state="open" reason="syn-ack"/><service name="https" product="nginx"/></port></ports><os><osmatch name="Linux 5.10" accuracy="94"/></os></host>
<host><status state="up"/><address addr="192.168.1.50" addrtype="ipv4"/><address addr="B8:27:EB:AA:BB:CC" addrtype="mac" vendor="Raspberry Pi Foundation"/><ports>
<port protocol="tcp" portid="22"><state state="open" reason="syn-ack"/><service name="ssh" product="OpenSSH" version="8.4p1"/></port></ports><os><osmatch name="Linux 5.4" accuracy="90"/></os></host>
<runstats><finished elapsed="18.42" summary="256 IP addresses (4 hosts up) scanned in 18.42 seconds"/></runstats></nmaprun>`;

export const demoScanAfter = `<?xml version="1.0"?><nmaprun scanner="nmap" args="nmap -sS -sV -O -oX lab-friday.xml 192.168.1.0/24 10.0.5.0/24" startstr="Fri Nov 27 09:00:00 2026" version="7.95"><scaninfo type="syn" protocol="tcp"/>
<host><status state="up"/><address addr="192.168.1.1" addrtype="ipv4"/><address addr="A4:2B:B0:11:22:33" addrtype="mac" vendor="TP-Link"/><hostnames><hostname name="router.lan"/></hostnames><ports>
<port protocol="tcp" portid="53"><state state="open" reason="syn-ack"/><service name="domain" product="dnsmasq" version="2.90"/></port>
<port protocol="tcp" portid="80"><state state="open" reason="syn-ack"/><service name="http" product="lighttpd" version="1.4.59"/><script id="http-title" output="Router login"/></port>
<port protocol="tcp" portid="443"><state state="open" reason="syn-ack"/><service name="https" product="lighttpd" version="1.4.59"/><script id="ssl-cert" output="Subject: router.lan; Not valid after: 2026-12-01"/></port>
<port protocol="tcp" portid="23"><state state="open" reason="syn-ack"/><service name="telnet" product="BusyBox telnetd"/></port></ports><os><osmatch name="Linux 4.15 - 5.19" accuracy="96"/></os></host>
<host><status state="up"/><address addr="192.168.1.20" addrtype="ipv4"/><address addr="3C:22:FB:44:55:66" addrtype="mac" vendor="Apple"/><hostnames><hostname name="macbook.lan"/></hostnames><ports>
<port protocol="tcp" portid="22"><state state="open" reason="syn-ack"/><service name="ssh" product="OpenSSH" version="9.6"/></port></ports><os><osmatch name="Apple macOS 14" accuracy="91"/></os></host>
<host><status state="up"/><address addr="192.168.1.35" addrtype="ipv4"/><address addr="00:11:32:77:88:99" addrtype="mac" vendor="Synology"/><hostnames><hostname name="nas.lan"/></hostnames><ports>
<port protocol="tcp" portid="445"><state state="open" reason="syn-ack"/><service name="microsoft-ds" product="Samba smbd" version="4"/><script id="smb-security-mode" output="message_signing: disabled (dangerous, but default)"/></port>
<port protocol="tcp" portid="5001"><state state="open" reason="syn-ack"/><service name="https" product="nginx"/></port>
<port protocol="tcp" portid="3389"><state state="open" reason="syn-ack"/><service name="ms-wbt-server" product="xrdp"/></port></ports><os><osmatch name="Linux 5.10" accuracy="94"/></os></host>
<host><status state="up"/><address addr="192.168.1.77" addrtype="ipv4"/><address addr="44:65:0D:12:34:56" addrtype="mac" vendor="Amazon Technologies"/><ports>
<port protocol="tcp" portid="8080"><state state="open" reason="syn-ack"/><service name="http-proxy"/></port></ports><os><osmatch name="Linux 4.x" accuracy="85"/></os></host>
<host><status state="up"/><address addr="10.0.5.10" addrtype="ipv4"/><hostnames><hostname name="web01.lab"/></hostnames><ports>
<port protocol="tcp" portid="80"><state state="open" reason="syn-ack"/><service name="http" product="Apache httpd" version="2.4.58"/></port>
<port protocol="tcp" portid="443"><state state="open" reason="syn-ack"/><service name="https" product="Apache httpd" version="2.4.58"/></port>
<port protocol="tcp" portid="3306"><state state="open" reason="syn-ack"/><service name="mysql" product="MySQL" version="8.0.36"/></port></ports><os><osmatch name="Ubuntu Linux 22.04" accuracy="93"/></os></host>
<host><status state="up"/><address addr="10.0.5.11" addrtype="ipv4"/><hostnames><hostname name="dc01.lab"/></hostnames><ports>
<port protocol="tcp" portid="53"><state state="open" reason="syn-ack"/><service name="domain" product="Microsoft DNS"/></port>
<port protocol="tcp" portid="445"><state state="open" reason="syn-ack"/><service name="microsoft-ds" product="Microsoft Windows Server 2022"/></port>
<port protocol="tcp" portid="3389"><state state="open" reason="syn-ack"/><service name="ms-wbt-server" product="Microsoft Terminal Services"/></port></ports><os><osmatch name="Microsoft Windows Server 2022" accuracy="97"/></os></host>
<runstats><finished elapsed="41.07" summary="512 IP addresses (6 hosts up) scanned in 41.07 seconds"/></runstats></nmaprun>`;

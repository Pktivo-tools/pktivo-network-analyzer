import type { Quiz } from './curriculum';

export type Lesson = { heading: string; body: string };
export type CourseModule = { simple: string; lessons: Lesson[]; questions: Quiz[] };

/** Extra reading and test questions per curriculum module, keyed by module ID. */
export const course: Record<string, CourseModule> = {
  'what-is-network': {
    simple: 'A network is like a road system: devices are houses, cables and Wi-Fi are roads, and routers are the junctions that send traffic the right way.',
    lessons: [
      { heading: 'Endpoints and intermediary devices', body: 'Endpoints are where data starts and ends: laptops, phones, printers, servers. Intermediary devices sit in the middle and move data: switches connect devices inside one local network, routers connect different networks, access points connect wireless devices, and firewalls decide which traffic is allowed. A home router usually does all of these jobs in one box.' },
      { heading: 'LAN, WAN and the internet', body: 'A LAN (Local Area Network) covers a small area you control, like a home or office floor. A WAN (Wide Area Network) links LANs over long distances, often through a service provider. The internet is millions of networks connected together by routers that exchange routes with each other.' },
      { heading: 'Topologies and design', body: 'Topology means the shape of the connections. Most LANs are a star: every device plugs into a central switch. WAN cores often use a partial or full mesh so one broken link does not cut everything off. Campus networks use a three-tier design — access (where users plug in), distribution (policy and routing between access switches) and core (fast backbone). Smaller sites collapse distribution and core into one layer (two-tier). Data centers use spine-leaf, where every leaf switch connects to every spine switch for predictable latency.' },
    ],
    questions: [
      { q: 'In a three-tier campus design, where do end users plug in?', choices: ['Core', 'Distribution', 'Access'], answer: 2, why: 'The access layer connects end devices; distribution aggregates; core is the backbone.' },
      { q: 'Which design connects every leaf switch to every spine switch?', choices: ['Spine-leaf', 'Collapsed core', 'Star'], answer: 0, why: 'Spine-leaf gives every server the same number of hops to any other.' },
    ],
  },
  'osi-tcpip': {
    simple: 'Sending data is like mailing a letter inside several envelopes. Each layer adds its own envelope with its own address, and the receiver opens them in reverse order.',
    lessons: [
      { heading: 'Why layers exist', body: 'Layers let each technology do one job. A web browser does not need to know whether the cable is copper or Wi-Fi; it just hands data to the layer below. This also makes troubleshooting easier: you can test one layer at a time.' },
      { heading: 'The seven OSI layers', body: 'Layer 7 Application (HTTP, DNS) is what programs use. Layer 6 Presentation handles formats and encryption. Layer 5 Session keeps conversations organised. Layer 4 Transport (TCP, UDP) delivers data to the right app using ports. Layer 3 Network (IP) addresses and routes between networks. Layer 2 Data Link (Ethernet, Wi-Fi) moves frames between neighbours using MAC addresses. Layer 1 Physical sends bits as electricity, light or radio.' },
      { heading: 'Encapsulation and de-encapsulation', body: 'Going down the stack, each layer adds a header: data becomes a segment (TCP header), then a packet (IP header), then a frame (Ethernet header and trailer), then bits. The receiver strips headers on the way up. Routers look as far as Layer 3; switches usually only look at Layer 2.' },
    ],
    questions: [
      { q: 'Which OSI layer uses port numbers?', choices: ['Layer 2', 'Layer 3', 'Layer 4'], answer: 2, why: 'Transport (Layer 4) uses ports to identify applications.' },
      { q: 'Adding headers as data moves down the stack is called…', choices: ['Encapsulation', 'Fragmentation', 'Routing'], answer: 0, why: 'Each layer wraps the data from the layer above.' },
    ],
  },
  cabling: {
    simple: 'Cables are the roads. Copper is the cheap local street, fiber is the motorway for long distances, and Wi-Fi is like shouting across a room.',
    lessons: [
      { heading: 'Copper twisted pair', body: 'UTP cable has four twisted pairs; twisting cancels interference. Cat5e supports 1 Gbps, Cat6a supports 10 Gbps, both up to 100 metres. Straight-through cables connect unlike devices (PC to switch), crossover connects like devices, but modern ports use Auto-MDIX and fix it automatically.' },
      { heading: 'Fiber optics', body: 'Fiber carries light, so it ignores electrical interference and goes much further. Multimode fiber has a wide core and is used inside buildings (hundreds of metres). Single-mode has a tiny core and a laser, reaching many kilometres. Switches accept fiber through SFP or SFP+ transceiver modules.' },
      { heading: 'Interface problems', body: 'Both ends of a link should agree on speed and duplex. A duplex mismatch (one side full, one half) causes late collisions and slow transfers. CRC errors usually mean a damaged cable or interference. Check counters with show interfaces.' },
    ],
    questions: [
      { q: 'What is the maximum standard length for a UTP Ethernet run?', choices: ['50 m', '100 m', '500 m'], answer: 1, why: 'Twisted-pair Ethernet is specified up to 100 metres.' },
      { q: 'Rising CRC errors on an interface most often point to…', choices: ['A bad cable or interference', 'A wrong IP address', 'A DNS failure'], answer: 0, why: 'CRC errors mean frames arrived corrupted — a Layer 1 problem.' },
    ],
  },
  'ethernet-mac': {
    simple: 'A MAC address is the name tag on a network card. Switches remember which tag lives behind which port, so they can deliver frames directly.',
    lessons: [
      { heading: 'The Ethernet frame', body: 'A frame contains a preamble, destination MAC, source MAC, an EtherType (which says what is inside, e.g. 0x0800 for IPv4), the payload, and the FCS checksum. If the FCS does not match, the frame is dropped.' },
      { heading: 'How a switch learns', body: 'When a frame arrives, the switch records the source MAC and the incoming port in its MAC address table. To forward, it looks up the destination MAC. If it is known, it sends the frame only out that port. If unknown, or broadcast, it floods the frame out all ports in the VLAN except the one it came from.' },
      { heading: 'Collision and broadcast domains', body: 'Every switch port is its own collision domain, so collisions are rare on modern full-duplex links. All ports in one VLAN share a broadcast domain. Routers stop broadcasts — that is one reason networks are split into subnets and VLANs.' },
    ],
    questions: [
      { q: 'What does a switch do with a frame to an unknown destination MAC?', choices: ['Drops it', 'Floods it', 'Sends it to the router'], answer: 1, why: 'Unknown unicast is flooded within the VLAN.' },
      { q: 'Which device stops broadcasts from spreading?', choices: ['Hub', 'Switch', 'Router'], answer: 2, why: 'Routers separate broadcast domains.' },
    ],
  },
  'ipv4-basics': {
    simple: 'An IP address is like a postal address: the network part is the street, the host part is the house number. The mask tells you where the street name ends.',
    lessons: [
      { heading: 'Binary and dotted decimal', body: 'Each of the four numbers is an octet — 8 bits, values 0 to 255. The bit values from left to right are 128, 64, 32, 16, 8, 4, 2, 1. For example 192 = 128 + 64 = 11000000. Being able to convert quickly is the base of subnetting.' },
      { heading: 'Masks and prefixes', body: 'A subnet mask like 255.255.255.0 marks network bits with 1s. The same mask is written /24 because it has 24 ones. Two hosts can talk directly only if they are in the same network; otherwise they send traffic to their default gateway.' },
      { heading: 'Special addresses', body: 'Private ranges (10/8, 172.16/12, 192.168/16) are not routed on the internet and are translated by NAT. 127.0.0.1 is loopback (the device itself). 169.254.x.x (APIPA) means DHCP did not answer. 255.255.255.255 is a local broadcast.' },
    ],
    questions: [
      { q: 'Which address is private?', choices: ['172.20.1.1', '172.32.1.1', '8.8.8.8'], answer: 0, why: '172.16.0.0/12 covers 172.16–172.31.' },
      { q: 'How many bits are in a /24 mask set to 1?', choices: ['8', '24', '32'], answer: 1, why: 'The prefix length counts network bits.' },
    ],
  },
  'tcp-udp': {
    simple: 'TCP is a phone call — you confirm the other side is listening and repeat anything missed. UDP is a postcard — quick, but nobody checks it arrived.',
    lessons: [
      { heading: 'TCP reliability', body: 'TCP starts with a three-way handshake: SYN, SYN-ACK, ACK. Every byte has a sequence number; the receiver acknowledges what it got, and lost segments are resent. Windowing lets the sender send several segments before waiting, and the window shrinks if the receiver is overloaded. FIN closes gracefully; RST aborts.' },
      { heading: 'UDP speed', body: 'UDP has an 8-byte header with just ports, length and checksum. No handshake, no retransmission. That is ideal for DNS lookups, DHCP, voice and video, where late data is useless anyway.' },
      { heading: 'Ports and sockets', body: 'A socket is IP address + protocol + port. Servers listen on well-known ports (0–1023); clients pick a random ephemeral port (usually 49152–65535). In Pktivo, Follow stream shows one socket pair as a conversation.' },
    ],
    questions: [
      { q: 'What is the second message of the TCP handshake?', choices: ['ACK', 'SYN-ACK', 'FIN'], answer: 1, why: 'SYN → SYN-ACK → ACK.' },
      { q: 'Which protocol is usually used for DNS queries?', choices: ['UDP 53', 'TCP 80', 'UDP 123'], answer: 0, why: 'DNS uses UDP 53 (TCP for large replies).' },
    ],
  },
  subnetting: {
    simple: 'Subnetting is cutting one big pizza into equal slices. The mask decides how big each slice is; you always lose two addresses per slice — the network and broadcast.',
    lessons: [
      { heading: 'The magic number method', body: 'Find the interesting octet (the one where the mask is not 255 or 0). Block size = 256 − that mask value. For /26 the mask is 255.255.255.192, block size 64, so subnets start at .0, .64, .128, .192.' },
      { heading: 'Worked example', body: 'Host 10.1.1.100/26: blocks of 64, so it is in 64–127. Network 10.1.1.64, first host .65, last host .126, broadcast .127. Usable hosts = 2^6 − 2 = 62.' },
      { heading: 'VLSM planning', body: 'Variable Length Subnet Masking gives each subnet only the size it needs. Sort requirements largest first, allocate from the start of the range, and move on to the next free block. Use /30 (2 hosts) or /31 (RFC 3021) for router-to-router links.' },
    ],
    questions: [
      { q: 'How many usable hosts does a /28 provide?', choices: ['14', '16', '30'], answer: 0, why: '4 host bits: 2^4 − 2 = 14.' },
      { q: 'What is the block size of 255.255.255.248?', choices: ['4', '8', '16'], answer: 1, why: '256 − 248 = 8.' },
    ],
  },
  ipv6: {
    simple: 'IPv6 gives so many addresses that every device can have its own public one. They are long, so there are rules to shorten them.',
    lessons: [
      { heading: 'Writing addresses', body: 'An IPv6 address is eight groups of four hex digits. Remove leading zeros in a group (0db8 → db8) and replace one run of all-zero groups with ::. 2001:0db8:0000:0000:0000:0000:0000:0001 becomes 2001:db8::1. You can only use :: once.' },
      { heading: 'Address types', body: 'Global unicast (2000::/3) is internet-routable. Link-local (FE80::/10) works only on one link and is used by routing protocols and as the next hop. Unique local (FC00::/7) is like private IPv4. Multicast (FF00::/8) replaces broadcast. Anycast is one address shared by several devices; the nearest answers.' },
      { heading: 'Getting an address', body: 'With SLAAC, a host listens for a Router Advertisement, takes the /64 prefix and builds its own interface ID, either randomly or via EUI-64 (MAC split, FFFE inserted, 7th bit flipped). Stateless DHCPv6 adds DNS info; stateful DHCPv6 assigns addresses like IPv4 DHCP.' },
    ],
    questions: [
      { q: 'How many times can :: appear in one IPv6 address?', choices: ['Once', 'Twice', 'Unlimited'], answer: 0, why: 'More than one would make the address ambiguous.' },
      { q: 'What replaces ARP in IPv6?', choices: ['DHCPv6', 'Neighbor Discovery', 'ICMP echo'], answer: 1, why: 'NDP uses Neighbor Solicitation and Advertisement.' },
    ],
  },
  'ios-basics': {
    simple: 'Cisco devices are controlled by typing commands. Like rooms in a house, you move between modes, and each mode lets you do different things.',
    lessons: [
      { heading: 'Modes', body: 'You start in user EXEC (Router>) with only basic show commands. enable moves you to privileged EXEC (Router#). configure terminal enters global configuration (Router(config)#). From there, interface g0/0 enters interface configuration. exit goes back one level; end returns to privileged mode.' },
      { heading: 'Configurations', body: 'Changes go into running-config (RAM) immediately and are lost on reboot unless you run copy running-config startup-config (or write memory). The IOS image itself is stored in flash.' },
      { heading: 'Securing management', body: 'Set enable secret (hashed) rather than enable password. Create local users with username admin secret …, set ip domain-name, generate RSA keys, enable ip ssh version 2, and on the VTY lines use login local and transport input ssh. service password-encryption hides other plain-text passwords weakly.' },
    ],
    questions: [
      { q: 'Which prompt shows privileged EXEC mode?', choices: ['Router>', 'Router#', 'Router(config)#'], answer: 1, why: '# without (config) means privileged EXEC.' },
      { q: 'What does copy running-config startup-config do?', choices: ['Saves the current config', 'Restores an old config', 'Deletes the config'], answer: 0, why: 'It writes RAM config to NVRAM.' },
    ],
  },
  vlans: {
    simple: 'VLANs are invisible walls inside a switch. Devices in different VLANs cannot talk unless a router lets them.',
    lessons: [
      { heading: 'Why VLANs', body: 'VLANs group users by function instead of location, shrink broadcast domains and improve security. Each VLAN is usually its own IP subnet.' },
      { heading: 'Access and trunk ports', body: 'An access port belongs to one VLAN and sends untagged frames to the end device. A trunk carries many VLANs between switches, adding an 802.1Q tag with a 12-bit VLAN ID (1–4094). Frames in the native VLAN cross the trunk untagged, so both ends must agree on it. Best practice: use an unused native VLAN and disable DTP.' },
      { heading: 'Inter-VLAN routing', body: 'Router-on-a-stick uses one trunk link to a router with subinterfaces (g0/0.10 with encapsulation dot1Q 10). A Layer 3 switch uses SVIs (interface vlan 10) and ip routing — faster and more common in campuses.' },
    ],
    questions: [
      { q: 'How are native VLAN frames sent on an 802.1Q trunk?', choices: ['Tagged', 'Untagged', 'Encrypted'], answer: 1, why: 'Native VLAN traffic has no tag.' },
      { q: 'Which interface type routes between VLANs on a Layer 3 switch?', choices: ['SVI', 'Loopback', 'Tunnel'], answer: 0, why: 'Switched Virtual Interfaces act as gateways for each VLAN.' },
    ],
  },
  'stp-etherchannel': {
    simple: 'Extra cables between switches give backup, but can make frames loop forever. Spanning Tree turns off the extra paths until they are needed.',
    lessons: [
      { heading: 'Why loops are dangerous', body: 'Ethernet has no time-to-live. With a loop, broadcasts circle forever (broadcast storm), MAC tables flap and the network collapses within seconds.' },
      { heading: 'How STP decides', body: '1) Elect the root bridge (lowest bridge ID). 2) Each other switch picks one root port — the lowest cost path to root. 3) Each segment picks one designated port. 4) Everything else is blocked (alternate). Costs: 10 Gbps = 2, 1 Gbps = 4, 100 Mbps = 19 (short method).' },
      { heading: 'Protections and bundles', body: 'PortFast makes host ports forward immediately; BPDU Guard err-disables them if a BPDU arrives. Root Guard stops another switch taking over. EtherChannel bundles 2–8 identical links into one logical link so STP sees one port and all links carry traffic. LACP: active/passive; PAgP: desirable/auto; or mode on (static).' },
    ],
    questions: [
      { q: 'What does BPDU Guard do when a BPDU arrives on a PortFast port?', choices: ['Ignores it', 'Err-disables the port', 'Makes the switch root'], answer: 1, why: 'It shuts the port to prevent loops from rogue switches.' },
      { q: 'Which pair of LACP modes forms a channel?', choices: ['passive / passive', 'active / passive', 'auto / auto'], answer: 1, why: 'At least one side must be active.' },
    ],
  },
  wireless: {
    simple: 'Wi-Fi is a network using radio instead of cables. Neighbouring access points must use different channels, just like radio stations.',
    lessons: [
      { heading: 'Radio basics', body: '2.4 GHz reaches further but has only three non-overlapping channels and more interference. 5 GHz and 6 GHz have many more channels and higher speeds but shorter range. Wi-Fi is half-duplex and uses CSMA/CA to avoid collisions.' },
      { heading: 'Architectures', body: 'Autonomous APs are configured one by one. Lightweight APs are managed by a Wireless LAN Controller over CAPWAP tunnels (control is encrypted, data optional). Cloud-managed APs (e.g. Meraki) are configured from a web dashboard.' },
      { heading: 'Security', body: 'WEP and WPA are broken. WPA2 uses AES-CCMP. WPA3 adds SAE, which resists offline password guessing, and protected management frames. Personal mode uses a shared passphrase; Enterprise uses 802.1X with a RADIUS server so each user has their own login.' },
    ],
    questions: [
      { q: 'Which protocol tunnels traffic between lightweight APs and a WLC?', choices: ['CAPWAP', 'LACP', 'HSRP'], answer: 0, why: 'CAPWAP carries control and data between AP and controller.' },
      { q: 'What does WPA3-Personal use instead of PSK?', choices: ['SAE', 'TKIP', 'WEP'], answer: 0, why: 'Simultaneous Authentication of Equals resists dictionary attacks.' },
    ],
  },
  routing: {
    simple: 'A router is a sign-post at a junction. It reads the destination on each packet and sends it toward the most specific matching sign.',
    lessons: [
      { heading: 'The routing decision', body: 'For each packet, the router finds all routes that match the destination and picks the one with the longest prefix. If two sources (e.g. OSPF and static) offer the same prefix, the lower administrative distance is installed. Within one protocol, the lowest metric wins.' },
      { heading: 'Static and default routes', body: 'ip route network mask next-hop|exit-interface. A default route (0.0.0.0/0) catches everything else — typical toward an ISP. A floating static route has a higher AD than the dynamic route it backs up, so it only appears when that route disappears.' },
      { heading: 'Reading show ip route', body: 'C = connected network, L = local /32 of the interface, S = static, O = OSPF, S* = static default (candidate default). [110/20] means AD 110, metric 20. The Gateway of last resort line shows the default.' },
    ],
    questions: [
      { q: 'What is the administrative distance of a static route?', choices: ['0', '1', '110'], answer: 1, why: 'Static routes default to AD 1.' },
      { q: 'What does a route code L mean?', choices: ['Learned', 'Local interface address', 'Loopback only'], answer: 1, why: 'L marks the router’s own /32 address on an interface.' },
    ],
  },
  ospf: {
    simple: 'OSPF routers share a map of the whole area with each other, then each one calculates the shortest path on its own copy of the map.',
    lessons: [
      { heading: 'Neighbors and adjacency', body: 'Routers send hellos every 10 seconds (dead timer 40 on broadcast links). To become neighbors they must match area ID, subnet and mask, hello/dead timers, authentication, and MTU; router IDs must be unique. The router ID is set manually, else the highest loopback IP, else the highest active interface IP.' },
      { heading: 'LSAs and SPF', body: 'Routers flood Link-State Advertisements describing their links into the LSDB. Once databases match (Full state), each runs Dijkstra’s SPF algorithm to build routes. Type 1 (router) and Type 2 (network) LSAs describe a single area.' },
      { heading: 'DR/BDR and cost', body: 'On Ethernet segments a DR and BDR are elected to reduce flooding; others stay 2-Way with each other (DROTHER). Highest priority wins (0 = never), then highest router ID; no preemption. Cost = 100 Mbps reference / interface speed — raise auto-cost reference-bandwidth so fast links are not all cost 1.' },
    ],
    questions: [
      { q: 'An OSPF interface with priority 0 will…', choices: ['Always become DR', 'Never become DR/BDR', 'Disable OSPF'], answer: 1, why: 'Priority 0 opts out of the election.' },
      { q: 'What is the default OSPF hello interval on Ethernet?', choices: ['5 s', '10 s', '30 s'], answer: 1, why: 'Hello 10 s, dead 40 s on broadcast networks.' },
    ],
  },
  fhrp: {
    simple: 'Hosts only know one gateway. FHRP lets two routers pretend to be that one gateway, so if one dies the other takes over silently.',
    lessons: [
      { heading: 'The problem', body: 'Hosts have one default gateway configured. If that router fails, the hosts lose access to other networks even if a second router exists.' },
      { heading: 'HSRP operation', body: 'Routers in an HSRP group share a virtual IP and virtual MAC. The highest priority (default 100) becomes active and answers ARP for the virtual IP; the standby watches hellos (3 s, hold 10 s). Preemption is off by default. HSRPv2 uses a different virtual MAC (0000.0c9f.fXXX) and supports more groups.' },
      { heading: 'VRRP and GLBP', body: 'VRRP is the IETF standard; the master can own the virtual IP and preemption is on by default. GLBP gives each router a different virtual MAC so hosts are spread across all gateways for load balancing.' },
    ],
    questions: [
      { q: 'What is the default HSRP priority?', choices: ['0', '100', '255'], answer: 1, why: 'Default priority is 100; higher wins.' },
      { q: 'Which FHRP load-balances across multiple routers by default?', choices: ['HSRP', 'VRRP', 'GLBP'], answer: 2, why: 'GLBP hands out different virtual MACs.' },
    ],
  },
  'ip-services': {
    simple: 'These are the helpers of the network: DHCP hands out addresses, DNS turns names into numbers, NAT shares one public address, NTP keeps clocks right, and Syslog writes the diary.',
    lessons: [
      { heading: 'NAT terminology', body: 'Inside local = private address of the host. Inside global = the public address it is translated to. Outside global = the real address of the remote server. PAT (overload) lets many hosts share one public IP by tracking source ports.' },
      { heading: 'DHCP and DNS', body: 'DHCP clients broadcast Discover; the server Offers, the client Requests, the server Acks. Routers do not forward broadcasts, so ip helper-address relays them to a remote server. DNS resolves names: A records hold IPv4, AAAA IPv6, CNAME aliases, MX mail servers.' },
      { heading: 'Management and QoS', body: 'NTP stratum 1 is closest to an atomic clock. Syslog levels: 0 Emergency, 1 Alert, 2 Critical, 3 Error, 4 Warning, 5 Notice, 6 Informational, 7 Debugging. SNMP managers poll agents (GET) and agents send traps; use SNMPv3 for security. QoS marks traffic with DSCP; voice uses EF (46) and priority queuing to avoid delay and jitter.' },
    ],
    questions: [
      { q: 'Which NAT term describes a host’s private address?', choices: ['Inside local', 'Inside global', 'Outside global'], answer: 0, why: 'Inside local is the address as seen inside the network.' },
      { q: 'Which Syslog severity level is Warning?', choices: ['2', '4', '6'], answer: 1, why: '0 Emergency … 4 Warning … 7 Debugging.' },
    ],
  },
  security: {
    simple: 'Security is locks and guards: strong passwords, rules that allow only good traffic, and switches that refuse fake devices.',
    lessons: [
      { heading: 'Threat concepts', body: 'A vulnerability is a weakness, a threat is something that could use it, an exploit is the actual technique, and mitigation reduces the risk. Common attacks include phishing and social engineering, DoS/DDoS, spoofing, man-in-the-middle (often via ARP spoofing), reconnaissance scans and malware.' },
      { heading: 'Access control lists', body: 'ACLs are processed top-down; the first match wins, and an invisible deny any ends every list. Wildcard masks are inverted masks (0.0.0.255 matches a /24). Standard ACLs match only source, so place them near the destination; extended ACLs match source, destination, protocol and port, so place them near the source. One ACL per interface, per direction, per protocol.' },
      { heading: 'Layer 2 protection', body: 'Port security limits MAC addresses per port (violation modes: protect, restrict, shutdown). DHCP snooping marks trusted ports so rogue DHCP servers are blocked and builds a binding table. Dynamic ARP Inspection uses that table to drop forged ARP replies. AAA centralises login: RADIUS (UDP, combines authentication and authorization) or TACACS+ (TCP 49, separates them, encrypts the whole body).' },
    ],
    questions: [
      { q: 'What is at the end of every ACL?', choices: ['Implicit permit any', 'Implicit deny any', 'Nothing'], answer: 1, why: 'Traffic not matched is dropped.' },
      { q: 'Which feature drops forged ARP replies?', choices: ['DHCP snooping', 'Dynamic ARP Inspection', 'PortFast'], answer: 1, why: 'DAI checks ARP against the DHCP snooping bindings.' },
    ],
  },
  automation: {
    simple: 'Instead of typing commands on 100 devices one by one, you tell a program what you want and it configures all of them.',
    lessons: [
      { heading: 'Planes', body: 'The data plane forwards packets. The control plane builds tables (OSPF, STP, ARP). The management plane is how you access the device (SSH, SNMP). SDN moves control-plane decisions to a central controller.' },
      { heading: 'Controllers and APIs', body: 'Applications talk to the controller through northbound APIs (usually REST). The controller talks to devices through southbound interfaces such as NETCONF, RESTCONF, OpenFlow or SSH. Intent-based networking: you describe the goal, the controller works out the configuration. In SD-Access, the underlay is the physical IP network and the overlay is the virtual network (VXLAN) on top.' },
      { heading: 'REST and config tools', body: 'REST uses HTTP: GET reads, POST creates, PUT replaces, PATCH updates, DELETE removes. Response codes: 2xx success, 4xx client error (401 unauthorized, 404 not found), 5xx server error. Ansible uses YAML playbooks over SSH with no agent; Puppet (manifests) and Chef (recipes/cookbooks) use agents; Terraform provisions infrastructure declaratively.' },
    ],
    questions: [
      { q: 'Which HTTP method is used to read data from a REST API?', choices: ['GET', 'POST', 'DELETE'], answer: 0, why: 'GET retrieves a resource without changing it.' },
      { q: 'Which plane makes routing decisions?', choices: ['Data', 'Control', 'Management'], answer: 1, why: 'The control plane builds the forwarding tables.' },
    ],
  },
  json: {
    simple: 'JSON is a tidy way to write data that both humans and programs can read: names with values, lists in square brackets.',
    lessons: [
      { heading: 'Structure', body: 'An object is a set of "key": value pairs inside curly braces, separated by commas. An array is an ordered list inside square brackets. Objects and arrays can be nested, for example an interfaces array containing one object per interface.' },
      { heading: 'Reading an example', body: '{"hostname": "R1", "interfaces": [{"name": "g0/0", "up": true}]} — hostname is a string; interfaces is an array with one object; up is a boolean. To read the first interface name you would follow interfaces → [0] → name.' },
      { heading: 'Common mistakes', body: 'Single quotes, trailing commas, missing quotes around keys and comments all make JSON invalid. Whitespace does not matter.' },
    ],
    questions: [
      { q: 'Which is valid JSON?', choices: ["{'a': 1}", '{"a": 1}', '{a: 1,}'], answer: 1, why: 'Keys need double quotes and no trailing comma.' },
      { q: 'What type is the value true in JSON?', choices: ['String', 'Boolean', 'Number'], answer: 1, why: 'true and false are booleans; "true" in quotes would be a string.' },
    ],
  },
  virtualization: {
    simple: 'Virtualization is running many pretend computers on one real computer. Cloud is renting those pretend computers from someone else.',
    lessons: [
      { heading: 'Hypervisors and VMs', body: 'A Type 1 hypervisor (ESXi, Hyper-V, KVM) runs directly on hardware — used in data centers. A Type 2 hypervisor (VirtualBox, VMware Workstation) runs as an app on a normal OS. Each VM has its own operating system and virtual NICs connected to a virtual switch.' },
      { heading: 'Containers and VRFs', body: 'Containers (Docker, orchestrated by Kubernetes) package an app with its libraries but share the host kernel, so they are small and start in seconds. VRFs create separate routing tables on one router, allowing overlapping IP ranges for different customers.' },
      { heading: 'Cloud', body: 'NIST defines cloud traits: on-demand self-service, broad network access, resource pooling, rapid elasticity, measured service. IaaS gives virtual machines, PaaS gives a platform to run code, SaaS gives finished software. Connect to cloud through the internet, VPN, or private WAN links.' },
    ],
    questions: [
      { q: 'Which hypervisor type runs directly on hardware?', choices: ['Type 1', 'Type 2', 'Container engine'], answer: 0, why: 'Type 1 is bare-metal.' },
      { q: 'What lets one router keep separate routing tables?', choices: ['VLAN', 'VRF', 'NAT'], answer: 1, why: 'Virtual Routing and Forwarding isolates tables.' },
    ],
  },
  troubleshooting: {
    simple: 'Be a detective: find out exactly what is broken, test one thing at a time, fix it, check it really works, and write down what you did.',
    lessons: [
      { heading: 'A repeatable process', body: '1) Define the problem precisely (who, what, since when). 2) Gather information. 3) Analyse and form a hypothesis. 4) Test it. 5) Implement the fix. 6) Verify. 7) Document. Change one thing at a time so you know what fixed it.' },
      { heading: 'Picking a method', body: 'Bottom-up starts with cables and lights — good when hardware is suspected. Top-down starts with the application — good for single-app issues. Divide-and-conquer starts with ping (Layer 3): if it works, look up; if not, look down. Follow-the-path traces each hop with traceroute.' },
      { heading: 'Evidence from the wire', body: 'show ip interface brief tells you up/down status fast. CDP/LLDP reveal neighbors and miswired ports. Packet captures prove what really happens: missing DHCP Offers, TCP resets, DNS errors. Open a capture in Pktivo and read the Overview findings as clues, then confirm with filters.' },
    ],
    questions: [
      { q: 'Which method usually starts with a ping test?', choices: ['Bottom-up', 'Top-down', 'Divide-and-conquer'], answer: 2, why: 'It starts at Layer 3 and moves up or down.' },
      { q: 'What should you do after verifying a fix?', choices: ['Document it', 'Reboot everything', 'Nothing'], answer: 0, why: 'Documentation saves time the next time it happens.' },
    ],
  },
  exam: {
    simple: 'The exam rewards practice, not memorising. Lab every day, subnet quickly, and move on when a question takes too long.',
    lessons: [
      { heading: 'Study plan', body: 'Plan 3–6 months. Follow the official exam topics list, read one area at a time, lab it in Packet Tracer or CML the same day, then test yourself. Revisit weak areas weekly.' },
      { heading: 'Exam day', body: 'Read every word — “not”, “best” and “first” change the answer. You cannot go back, so do not leave questions blank. Simulations can take long; budget your time and keep a steady pace.' },
      { heading: 'Final checklist', body: 'Can you subnet in under 30 seconds? Configure VLANs, trunks, OSPF, static routes, NAT, DHCP and ACLs from memory? Read show command output and JSON? Explain wireless, security and automation concepts in your own words? If yes, book the exam.' },
    ],
    questions: [
      { q: 'Can you go back to earlier questions in the CCNA exam?', choices: ['Yes', 'No', 'Only in labs'], answer: 1, why: 'Answers are final once you move on.' },
      { q: 'Which domain is about 15% of the exam?', choices: ['Security Fundamentals', 'IP Services', 'Network Access'], answer: 0, why: 'Security Fundamentals ≈ 15%.' },
    ],
  },
};

export function questionsFor(moduleId: string, base: Quiz): Quiz[] {
  return [base, ...(course[moduleId]?.questions ?? [])];
}

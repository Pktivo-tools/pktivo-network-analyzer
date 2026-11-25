export function ipv4Number(ip: string): number {
  const parts = ip.trim().split('.');
  if (parts.length !== 4 || parts.some(p => !/^\d{1,3}$/.test(p) || Number(p) > 255)) throw new Error('Enter four numbers from 0 to 255, separated by dots.');
  return parts.reduce((n, p) => n * 256 + Number(p), 0);
}

export function ipv4String(n: number): string {
  return [24, 16, 8, 0].map(shift => Math.floor(n / 2 ** shift) % 256).join('.');
}

export function subnet(ip: string, prefix: number) {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) throw new Error('Choose a prefix from /0 to /32.');
  const value = ipv4Number(ip);
  const size = 2 ** (32 - prefix);
  const network = Math.floor(value / size) * size;
  const last = network + size - 1;
  const special = prefix >= 31;
  return {
    network: ipv4String(network), broadcast: prefix < 31 ? ipv4String(last) : null,
    first: ipv4String(special ? network : network + 1), last: ipv4String(special ? last : last - 1),
    mask: ipv4String(2 ** 32 - size), size, hosts: special ? size : size - 2,
    bits: value.toString(2).padStart(32, '0'), prefix,
  };
}

export function prefixForHosts(hosts: number): number {
  if (!Number.isInteger(hosts) || hosts < 1 || hosts > 2 ** 32 - 2) throw new Error('Enter a valid number of LAN hosts.');
  return 32 - Math.ceil(Math.log2(hosts + 2));
}

export const subnetLessons = [
  { id: 'subnet-ipv4', title: 'IPv4 and binary', level: 'Beginner', simple: 'An IP address is a device’s address. A subnet is its neighborhood.',
    readings: [
      { heading: 'Four numbers, 32 bits', body: 'An IPv4 address has four octets, each from 0 to 255. Each octet is eight binary digits, giving 32 bits in total. The bit values are 128, 64, 32, 16, 8, 4, 2 and 1. Add the values of the bits that are 1: 11000000 is 128 + 64 = 192.' },
      { heading: 'Network part and device part', body: 'A prefix separates the network bits from the host bits. With 192.168.1.42/24, the first 24 bits identify 192.168.1.0, while the last eight identify addresses inside that subnet. Devices in the same subnet normally reach one another directly; other subnets need a router.' },
    ], example: '192.168.1.42 = 11000000.10101000.00000001.00101010', takeaway: 'Eight bits per octet; 32 bits per IPv4 address.' },
  { id: 'subnet-cidr', title: 'CIDR prefixes and masks', level: 'Beginner', simple: 'The slash tells you how much of the address names the neighborhood.',
    readings: [
      { heading: 'Read the slash', body: 'In /24, 24 bits are network bits and 8 are host bits. A subnet mask writes network bits as 1 and host bits as 0: /24 is 255.255.255.0. Increasing the prefix makes a smaller subnet: /25 has 128 addresses, /26 has 64, /27 has 32 and /28 has 16.' },
      { heading: 'Prefixes can cross octets', body: '/20 is 255.255.240.0: eight ones in each of the first two octets, four in the third, and none in the fourth. For a changing octet, subtract the mask value from 256 to find the block increment. A /20 advances by 16 in the third octet.' },
    ], example: '/26 → 11111111.11111111.11111111.11000000 → 255.255.255.192', takeaway: 'More network bits means fewer addresses in each subnet.' },
  { id: 'subnet-ranges', title: 'Find the network and host range', level: 'Intermediate', simple: 'Find the block containing the address, then reserve its first and last addresses for an ordinary LAN.',
    readings: [
      { heading: 'Find the block', body: 'For 192.168.10.77/26, the block size is 64. Blocks start at .0, .64, .128 and .192. Address .77 is in .64–.127, so the network address is 192.168.10.64 and the broadcast address is 192.168.10.127. The usable range is .65–.126.' },
      { heading: 'Count usable addresses', body: 'For ordinary /0–/30 IPv4 subnets, total addresses = 2 raised to the number of host bits, and usable hosts = total minus two. The network address identifies the subnet; the broadcast address reaches the subnet’s hosts. /31 point-to-point links and /32 host routes are exceptions, covered later.' },
    ], example: '192.168.10.77/26 → network .64 · first .65 · last .126 · broadcast .127', takeaway: 'For ordinary LANs, the network and broadcast addresses are not device addresses.' },
  { id: 'subnet-sizing', title: 'Size a subnet and split a network', level: 'Intermediate', simple: 'Choose the smallest neighborhood with enough room for every device.',
    readings: [
      { heading: 'Work backward from devices', body: 'A LAN needs 50 usable addresses. Five host bits give 32 total and 30 usable, which is too small. Six give 64 total and 62 usable, so choose /26. Include gateways, printers, management addresses and expected growth when counting required hosts.' },
      { heading: 'Borrow bits', body: 'Splitting a /24 into /26 networks borrows two host bits. That creates 2² = four equal subnets, each with 62 ordinary usable addresses. Splitting into /27 borrows three bits, creating eight subnets with 30 usable addresses each. Keep subnet boundaries aligned.' },
    ], example: '50 LAN hosts → 50 + 2 = 52 → next power of two is 64 → /26', takeaway: 'Round up, not down, and count the gateway too.' },
  { id: 'subnet-vlsm', title: 'VLSM address planning', level: 'Advanced', simple: 'Give large teams large blocks and small teams small blocks without overlapping.',
    readings: [
      { heading: 'Allocate largest first', body: 'Variable Length Subnet Masking uses different prefix lengths in one address plan. In 192.168.20.0/24, allocate a 100-host LAN as .0/25 (126 usable), a 50-host LAN as .128/26 (62 usable), and a 20-host LAN as .192/27 (30 usable). The .224/27 block remains free.' },
      { heading: 'Check fit and overlap', body: 'Each network must start on a boundary for its block size. Do not start a /26 at .160: that address belongs to .128/26. Write every network, broadcast and usable range in a table. Verify each block stays inside the parent network and never overlaps another allocation.' },
    ], example: '100 hosts: .0/25 · 50 hosts: .128/26 · 20 hosts: .192/27 · free: .224/27', takeaway: 'Largest first, aligned boundaries, no overlaps.' },
  { id: 'subnet-special', title: 'Special prefixes and CCNA checks', level: 'Advanced', simple: 'Some addresses describe a link or one device instead of a normal LAN.',
    readings: [
      { heading: '/31 and /32 exceptions', body: 'On a supported point-to-point link, /31 uses both addresses as endpoints under RFC 3021; there is no directed broadcast. A /32 describes exactly one address, commonly a loopback or host route, and has no broadcast address. Do not apply the ordinary minus-two rule to these prefixes.' },
      { heading: 'Summarize only compatible blocks', body: 'Adjacent networks can be summarized when they share the leading bits and align to the summary boundary. 192.168.0.0/24 and 192.168.1.0/24 fit 192.168.0.0/23. But 192.168.1.0/24 and 192.168.2.0/24 do not form one exact /23. Summaries that include extra addresses can route traffic somewhere unintended.' },
    ], example: '/30: 2 ordinary hosts · /31: 2 point-to-point endpoints · /32: 1 address', takeaway: 'Check boundaries and prefix exceptions before choosing an answer.' },
];

export type PracticeLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export interface SubnetQuestion { prompt: string; answer: string; hint: string; explanation: string }
export function makeSubnetQuestion(level: PracticeLevel, random: () => number = Math.random): SubnetQuestion {
  const pick = (n: number) => Math.min(n - 1, Math.max(0, Math.floor(random() * n)));
  const prefix = level === 'Beginner' ? 24 + pick(5) : level === 'Intermediate' ? 20 + pick(11) : 16 + pick(15);
  const ip = `192.168.${pick(256)}.${1 + pick(254)}`;
  const result = subnet(ip, prefix);
  const kind = pick(level === 'Beginner' ? 2 : level === 'Intermediate' ? 4 : 5);
  if (kind === 0) return { prompt: `What subnet mask matches /${prefix}?`, answer: result.mask, hint: `Write ${prefix} ones, then ${32 - prefix} zeros, across four octets.`, explanation: `/${prefix} has ${prefix} network bits. Its mask is ${result.mask}.` };
  if (kind === 1) return { prompt: `How many usable LAN hosts fit in /${prefix}?`, answer: String(result.hosts), hint: `There are ${32 - prefix} host bits. For this ordinary LAN, subtract two from the address count.`, explanation: `2^${32 - prefix} − 2 = ${result.hosts} usable hosts.` };
  if (kind === 2) return { prompt: `What is the network address for ${ip}/${prefix}?`, answer: result.network, hint: `Set all ${32 - prefix} host bits to zero.`, explanation: `${ip}/${prefix} belongs to ${result.network}/${prefix}. The usable range is ${result.first}–${result.last}.` };
  if (kind === 3) return { prompt: `What is the broadcast address for ${ip}/${prefix}?`, answer: result.broadcast ?? result.last, hint: 'Set all the host bits to one.', explanation: `The block begins at ${result.network} and ends at ${result.broadcast}. That last address is the broadcast.` };
  const hosts = [14, 30, 50, 100, 200, 500][pick(6)] ?? 50;
  const fit = prefixForHosts(hosts);
  return { prompt: `What is the longest prefix that fits ${hosts} usable LAN hosts?`, answer: `/${fit}`, hint: `Find the smallest power of two at least as large as ${hosts + 2}.`, explanation: `/${fit} provides ${subnet('10.0.0.0', fit).hosts} usable hosts. /${fit + 1} would be too small.` };
}

export function checkSubnetAnswer(input: string, expected: string): boolean {
  const normalized = input.trim();
  return expected.startsWith('/') ? normalized.replace(/^\//, '') === expected.slice(1) : normalized === expected;
}
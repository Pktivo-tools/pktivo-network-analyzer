import { describe, expect, it } from 'vitest';
import { subnet, prefixForHosts, makeSubnetQuestion, checkSubnetAnswer, createSubnetExam, gradeSubnetExam, subnetLessons } from '@/lib/learn/subnetting';
import { subnetScenarios } from '@/lib/learn/subnetting-advanced';

describe('subnetting course calculations', () => {
  it('adds a professional scenario level without replacing the original course completion IDs', () => {
    expect(subnetLessons).toHaveLength(12);
    expect(subnetLessons.map(l => l.id)).toContain('subnet-ipv4');
    expect(makeSubnetQuestion('Professional', () => 0)).toMatchObject({ answer: '/25', topic: 'Capacity and growth' });
    expect(checkSubnetAnswer(' YES ', 'yes')).toBe(true);
    expect(checkSubnetAnswer('no', 'yes')).toBe(false);
  });
  it('finds an ordinary /26 network, mask and usable range', () => {
    expect(subnet('192.168.10.77', 26)).toMatchObject({ network: '192.168.10.64', broadcast: '192.168.10.127', first: '192.168.10.65', last: '192.168.10.126', mask: '255.255.255.192', hosts: 62, size: 64 });
  });
  it('handles subnet boundaries crossing octets', () => {
    expect(subnet('172.16.35.10', 20)).toMatchObject({ network: '172.16.32.0', broadcast: '172.16.47.255', mask: '255.255.240.0', hosts: 4094 });
  });
  it('supports point-to-point /31 without inventing a broadcast', () => {
    expect(subnet('10.0.0.1', 31)).toMatchObject({ first: '10.0.0.0', last: '10.0.0.1', broadcast: null, hosts: 2 });
  });
  it('supports a /32 host route and the full /0 range', () => {
    expect(subnet('10.0.0.1', 32)).toMatchObject({ network: '10.0.0.1', first: '10.0.0.1', last: '10.0.0.1', broadcast: null, hosts: 1 });
    expect(subnet('255.255.255.255', 0)).toMatchObject({ network: '0.0.0.0', broadcast: '255.255.255.255', mask: '0.0.0.0', hosts: 4294967294 });
  });
  it('chooses the smallest ordinary LAN with enough host addresses', () => {
    expect(prefixForHosts(50)).toBe(26);
    expect(prefixForHosts(100)).toBe(25);
    expect(prefixForHosts(20)).toBe(27);
  });
  it('rejects invalid addresses and prefixes', () => {
    expect(() => subnet('256.1.1.1', 24)).toThrow();
    expect(() => subnet('1.2.3', 24)).toThrow();
    expect(() => subnet('1.2.3.4', 33)).toThrow();
    expect(() => subnet('1.2.3.4', 2.5)).toThrow();
  });
  it('generates beginner, intermediate and advanced questions with checked answers', () => {
    expect(makeSubnetQuestion('Beginner', () => 0).answer).toBe('255.255.255.0');
    expect(makeSubnetQuestion('Intermediate', () => 0.6).answer).toBe('192.168.153.128');
    expect(makeSubnetQuestion('Advanced', () => 0.99).answer).toBe('/23');
    expect(checkSubnetAnswer(' 23 ', '/23')).toBe(true);
    expect(checkSubnetAnswer('/24', '/23')).toBe(false);
    expect(checkSubnetAnswer('63', '62')).toBe(false);
  });
});

describe('scenario answers and subnetting exam', () => {
  const cases: [string, string][] = [
    ['Capacity and growth', '/25'], ['Borrowed bits', '64'], ['VLSM allocation', '10.40.0.192/27'],
    ['VLSM router link', '10.40.0.224/30'], ['Alignment', 'no'], ['Overlap', 'yes'],
    ['Exact summarization', '10.20.8.0/22'], ['Summary overcoverage', '10.20.8.0/22'],
    ['Longest-prefix match', '10.20.9.0/24'], ['Wildcard inversion', '0.0.0.31'],
    ['Wildcard matching', 'yes'], ['Exact host match', '0.0.0.0'], ['Gateway validation', 'no'],
    ['Mismatched masks', 'no'], ['Cross-octet ranges', '172.16.47.254'], ['/31 exception', '10.0.0.5'],
    ['/32 exception', '1'], ['IPv6 subnet count', '256'], ['IPv6 allocation', '65536'],
    ['IPv6 broadcast', 'no'], ['Fragmented free space', '10.40.0.232/29'],
    ['Capacity versus block size', 'no'], ['Infrastructure counting', '/26'], ['Subnet indexing', '192.168.1.96/27'],
  ];
  it.each(cases)('checks the concrete answer for %s', (topic, answer) => {
    const q = subnetScenarios.find(q => q.topic === topic);
    expect(q?.answer).toBe(answer);
    expect(q && checkSubnetAnswer(answer, q.answer)).toBe(true);
    expect(q && checkSubnetAnswer('incorrect-answer', q.answer)).toBe(false);
  });
  it('creates 20 unique mixed questions without mutating the bank', () => {
    const before = subnetScenarios.map(q => q.prompt);
    const exam = createSubnetExam(() => 0.5);
    expect(exam).toHaveLength(20);
    expect(new Set(exam.map(q => q.prompt)).size).toBe(20);
    expect(new Set(exam.map(q => q.lessonId)).size).toBeGreaterThanOrEqual(8);
    expect(subnetScenarios.map(q => q.prompt)).toEqual(before);
  });
  it('grades correct, wrong and unanswered questions without inventing a passing score', () => {
    const qs = subnetScenarios.slice(0, 3);
    expect(gradeSubnetExam(qs, ['/25', 'wrong', ''])).toMatchObject({ correct: 1, total: 3, percent: 33 });
    expect(gradeSubnetExam(qs, qs.map(q => q.answer))).toMatchObject({ correct: 3, percent: 100 });
    expect(gradeSubnetExam(qs, []).correct).toBe(0);
  });
  it('maps every scenario back to a valid reading lesson', () => {
    const ids = new Set(subnetLessons.map(l => l.id));
    expect(subnetScenarios.every(q => ids.has(q.lessonId))).toBe(true);
  });
});
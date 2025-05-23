---

title: "Longest Prefix Matching"
authors: simonpainter
tags:
  - networks
date: 2024-11-17

---

When packets travel through a cloud network, they face many decision points. Among these, one stands out as really important: the initial routing decision. At its heart is an algorithm that might seem strange at first - the Longest Prefix Match (LPM). Why do we prioritise longer prefix matches? Why not shorter ones, or why not simply use the first match we find? The answer lies in a fascinating mix of computing efficiency, network design, and how cloud computing has evolved.
<!-- truncate -->
## The Journey from On-Premises to Cloud

Imagine you're designing the network for a large company in the early days of computing. Your routing table might look something like this:

```text
10.0.0.0/8     -> Corporate Network
10.1.0.0/16    -> Engineering Department
10.1.1.0/24    -> Production Servers
10.1.1.128/25  -> Critical Database Cluster
0.0.0.0/0      -> Internet Gateway
```

The default route (0.0.0.0/0) plays a special role here - it's the catch-all for any destination not explicitly covered by other routes. Without LPM, you'd need extra logic or careful ordering to make sure that more specific routes take priority over this default path. This becomes particularly tricky when routes are spread across multiple systems or when route tables change dynamically.

Think about a packet going to 10.1.1.200. Should it go to the corporate network? The engineering department? The production servers? The database cluster? Or should it follow the default route to the internet gateway? Without LPM, you'd need explicit priority rules to ensure the packet doesn't accidentally follow the default route or get caught by a broader prefix.

LPM neatly solves this by making the default route (with its /0 prefix) automatically have the lowest priority. More specific routes naturally take precedence because they have longer prefixes. This means network architects can add and remove routes without worrying about explicitly managing priority relative to the default route - a longer prefix will always win.

This becomes even more powerful when you consider that in modern networks, the default route often represents the path to the internet via an internet gateway. LPM ensures that internal traffic stays internal by matching more specific prefixes, while unknown destinations naturally follow the default route to the internet. The answer becomes obvious when you consider how specific each route is - the longer the prefix, the more specific the intention.

## The Computational Challenge

Let's look at what happens when we try different approaches to route matching. Note that this is just example pseudocode and not something you'd actually implement.

### Approach 1: First Match

```python
def first_match(routing_table, destination_ip):
    for route in routing_table:
        if matches_prefix(destination_ip, route.prefix):
            return route
    return None
```

This approach is O(n) in complexity, but its real problems are in route table maintenance. In a modern organisation running dynamic routing protocols, routes are constantly being added, removed, and updated across multiple regions and availability zones. Without LPM's natural ordering, we would need an explicit, maintained order of route evaluation. Network admins would need to carefully position each route in the table, making sure that more specific routes appear before more general ones. This ordering would need to be consistently maintained across all routing devices in the network. Given how difficult firewall rule ordering has been for us, I can only imagine how awful this approach would be.

The complexity of this coordination would grow exponentially with the size of the network. During any network change, there would be a risk of inconsistent ordering across devices, potentially causing routing loops or black holes. In cloud environments, where network changes happen frequently and automatically, this would be particularly problematic.

### Approach 2: Pure Metric-Based Routing

```python
def metric_based_routing(routing_table, destination_ip):
    matching_routes = []
    for route in routing_table:
        if matches_prefix(destination_ip, route.prefix):
            matching_routes.append(route)
    
    if not matching_routes:
        return None
    
    return select_best_metric_route(matching_routes)

def select_best_metric_route(routes):
    best_route = None
    best_metric = float('inf')
    for route in routes:
        metric = compute_composite_metric(
            route.bandwidth,
            route.latency,
            route.hop_count,
            route.link_reliability,
            route.administrative_distance
        )
        if metric < best_metric:
            best_metric = metric
            best_route = route
    return best_route
```

A purely metric-based approach would try to evaluate and compare metrics across routes of different prefix lengths. This creates significant challenges. The computational complexity would be O(n * m), where n is the number of routes in the table and m is the number of metrics we need to evaluate for each matching route. Moreover, comparing metrics between routes of different prefix lengths (like comparing a /24 against a /16) raises fundamental questions about how to weight specificity against other routing characteristics.

However, this doesn't mean metrics aren't valuable - quite the opposite. In modern routing systems, we use metrics extensively, but we do so within the narrowed scope that LPM provides. Instead of comparing metrics between routes of different prefix lengths, we only evaluate metrics between routes that share the same prefix length. This creates a natural hierarchy where:

1. First, we use LPM to find the most specific matching prefix
2. Then, only if we have multiple routes with that same prefix length, we evaluate metrics to choose between them

Consider a company network with multiple connections to AWS. They might have several BGP paths to reach 10.0.1.0/24, each with different characteristics:

- Path A: via a Direct Connect with 10Gbps capacity
- Path B: via a backup Direct Connect with 1Gbps capacity
- Path C: via a VPN connection

All these routes have the same prefix length (/24), so LPM has done its job by selecting this as the most specific match. Now we can evaluate metrics like bandwidth, latency, and monetary cost to choose between these equal-length alternatives. Importantly, we never need to compare these metrics against routes with different prefix lengths - that decision was already made by LPM.

This two-stage approach means that metric evaluation remains computationally manageable. The computational complexity becomes O(k * m), where k is the number of routes with the winning prefix length (typically a small number) and m is the number of metrics we evaluate. This makes it practical to use sophisticated metrics for path selection while maintaining the properties of LPM.

This principle extends neatly to cloud environments. Cloud providers can offer sophisticated traffic engineering while maintaining the fundamental principle that more specific routes always win. For example, Direct Connect and VPN connections can use metrics for failover while preserving intended routing boundaries, and Transit Gateway routing can optimise paths between VPCs while respecting network segmentation.

### Approach 3: Shortest Prefix Match

```python
def shortest_prefix_match(routing_table, destination_ip):
    best_match = None
    min_prefix_length = float('inf')
    
    for route in routing_table:
        if matches_prefix(destination_ip, route.prefix):
            if route.prefix_length < min_prefix_length:
                min_prefix_length = route.prefix_length
                best_match = route
    return best_match
```

This approach would prioritise more general routes over specific ones - essentially saying "always take the highway" even when there's a direct local road to your destination. In our example above, traffic to the critical database cluster would be routed through the general corporate network, potentially bypassing security controls and performance optimisations.

### Approach 4: Longest Prefix Match with Trie

```python
class TrieNode:
    def __init__(self):
        self.left = None    # 0
        self.right = None   # 1
        self.route = None   # Store route if this is a valid prefix

def lookup_route(root, destination_ip):
    node = root
    best_match = None
    
    for i in range(32):  # For IPv4
        if node.route:
            best_match = node.route
        
        bit = (destination_ip >> (31 - i)) & 1
        if bit == 0:
            if not node.left:
                break
            node = node.left
        else:
            if not node.right:
                break
            node = node.right
    
    return best_match if best_match else node.route
```

This approach not only guarantees we find the most specific route, but it does so in O(W) time where W is the IP address width (32 for IPv4, 128 for IPv6). The beauty of this approach is that it scales with address size, not routing table size.

## Conclusion

In cloud environments, this efficiency becomes even more crucial. When a packet enters an AWS VPC, it encounters a range of routing scenarios, from the default route to Internet Gateway through to specific routes for VPC endpoints. Similarly, in Azure's virtual networks, the routing hierarchy spans from system routes through to private endpoint routes. In both environments, the routing decision must be made quickly and consistently, often across distributed software-defined networking components.

The triumph of LPM lies in its elegant balance of computational efficiency, architectural intent, and scalability. With O(W) complexity regardless of routing table size, it ensures that the most specific routes take precedence while maintaining consistent performance whether deployed in small on-premises networks or massive cloud deployments.

The [trie](https://en.wikipedia.org/wiki/Trie)-based implementation allows for quick updates, which proves crucial in dynamic cloud environments where routes can change frequently due to auto-scaling events, failover scenarios, network policy updates, and service endpoint changes.

Today's cloud providers have built upon this foundation through various optimisations. Their implementations use multi-bit tries for faster lookups, compressed tries to reduce memory usage, and distributed tries for hardware-level parallelisation. Many use sophisticated caching strategies for frequently accessed routes. Yet the core principle remains unchanged: longer prefixes indicate more specific intent and take precedence in routing decisions.

Understanding why LPM forms the foundation of routing decisions helps cloud network engineers make better architectural choices. Whether designing a simple VPC or a complex multi-region network, knowing that routing decisions will consistently follow the most specific path allows for predictable and secure network designs.

The next time you write a route table entry, remember: you're not just adding a rule, you're participating in an elegant system that balances specificity with performance, enabling the massive scale of cloud networking.
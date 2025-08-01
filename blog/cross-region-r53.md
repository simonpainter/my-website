---

title: "Using AWS Route 53 instead of Anycast and RouteServer"
authors: simonpainter
tags:
  - aws
  - azure
  - anycast
  - dns
date: 2025-01-08

---

## Introduction

When working with Azure cloud networking, I've noticed certain limitations, particularly around DNS capabilities for private networks. In this post, I'll explore an unconventional approach: using Amazon Route 53 to address some of Azure's DNS limitations. While this might seem controversial, it offers interesting solutions to two specific challenges: cross-region failover for private resources and closest-instance routing within private networks.
<!-- truncate -->
>"Your scientists were so preoccupied with whether they could, they didn't stop to think if they should."
>
>Dr Ian Malcolm, Jurassic Park

## Background: The Azure Alternatives

[Adam Stuart](https://www.youtube.com/c/AdamStuart1/videos) does a great job [discussing the alternatives](https://github.com/adstuart/azure-crossregion-private-lb) from an Azure-centric viewpoint. The conventional approach to these requirements in Azure involves using [Anycast with RouteServer](anycast-route-server.md). While this solution elegantly addresses both needs, it requires implementing Network Virtual Appliances (NVAs). For organisations pursuing architectural purity, NVAs can become "pets" rather than "cattle" - a maintenance burden that goes against cloud-native principles.

The challenge then becomes finding a way to achieve these requirements using only cloud-native constructs. Using Azure alone, we face significant constraints. Cross-region failover requires exposing health checks to the internet, and closest-instance routing isn't feasible with Azure's native tooling for private networks. This is where AWS Route 53 enters the picture, offering more mature capabilities in these areas.

## Requirement 1: Cross-Region Failover

Route 53 provides health checking capabilities for private zones, though with some important caveats. The standard health checks, which we typically use for internet-accessible services, won't work within a VPC. However, I've found we can implement a reasonable workaround using AWS Lambda.

The solution begins with creating a Lambda function that performs health checks against private Azure resources. Using the [Python requests library](https://pypi.org/project/requests/) for example, it validates service availability of an http(s) endpoint and outputs the status to CloudWatch. These CloudWatch metrics then serve as the basis for monitoring the Lambda health check results and triggering Route 53 failover actions when needed.

This approach works beautifully for any private resource, whether it's in AWS, Azure, or even on-premises. When an Azure instance fails the Lambda health check, Route 53 automatically removes it from rotation and serves the next healthy instance in the chain, providing seamless failover capabilities. The lambda has to be triggered, but that can be done with CloudWatch events which are functionally equivalent to a cron job.

## Requirement 2: Closest-Instance Routing

The challenge of closest-instance routing presents a more complex puzzle. While Anycast traditionally solves this using the routing protocol's [network path selection](longest-prefix-matching.md), DNS-based solutions typically rely on geolocation databases - something that's problematic with private IP addresses.

I've found that AWS takes the query's originating region as the location identifier for geoproximity routing. We can leverage this by creating regional DNS records and assigning them to geoproximity routing with specified AWS regions for each record.

The integration between Azure and AWS is where things get interesting, particularly in the DNS resolver configuration. Let's look at how we can actually [set this up in a lab environment](https://github.com/simonpainter/cross-csp-r53).

### Setting Up Azure DNS Resolution

In Azure, I start by creating a Private DNS Resolver in our virtual network. This requires two special subnet delegations: one for the inbound endpoint and another for the outbound endpoint. The inbound endpoint isn't strictly necessary for our AWS integration, but it's good practice to set it up for a complete DNS architecture.

The crucial component is the outbound endpoint, which handles the forwarding of DNS queries to AWS. I create this in its dedicated subnet, and then establish a DNS forwarding ruleset. The ruleset acts as a container for our forwarding rules and needs to be linked to our virtual network.

The magic happens in the forwarding rule itself. I configure it to capture all queries for our domain (internal.example.com in this case) and forward them to the AWS Route 53 inbound resolver endpoints. Here's where attention to detail matters - the domain name needs that trailing dot (internal.example.com.), and we need to allow both TCP and UDP on port 53.

### Setting Up AWS Route 53

On the AWS side, I create a private hosted zone for internal.example.com and associate it with our VPC. The key component is the Route 53 Resolver inbound endpoint, which I configure with an IP address in the private subnet. This is the IP address that Azure's outbound resolver will forward queries to.

### The Flow in Action

When it all comes together, the DNS resolution flow works like this:

1) Azure VM queries systemd-resolved (127.0.0.53)
2) Query reaches Azure DNS Resolver
3) Azure Outbound Endpoint forwards query for internal.example.com
4) AWS Route53 Resolver Inbound receives query
5) Route53 private hosted zone resolves record
6) Response returns to Route53 Resolver Inbound
7) Response returns to Azure Outbound Endpoint
8) Response returns through Azure DNS Resolver to VM

```mermaid
flowchart LR
    subgraph Azure[Azure 172.16.1.0/24]
        VM1[VM]
        DNS[Azure DNS Resolver]
        Endpoint[Outbound Endpoint\n172.16.3.0/24]
        
        VM1 -->|Step 2| DNS
        DNS -->|"Step 3"| Endpoint
    end

    subgraph AWS[AWS]
        VM2[VM]
        R53Resolver[Route53 Resolver\nInbound]
        R53Private[Private Route53\nZone]
        
        R53Resolver -->|Step 5| R53Private
        R53Private --> VM2
    end

    %% Cross-cloud connections
    Endpoint -->|Step 4| R53Resolver
    R53Private -->|Steps 6-8| DNS

    classDef azure fill:#e6f3ff,stroke:#2d6ca2,stroke-width:2px
    classDef aws fill:#fdf8e6,stroke:#eb9b4a,stroke-width:2px
    classDef component fill:#ffffff,stroke:#666666,stroke-width:1px
    
    class Azure azure
    class AWS aws
    class VM1,DNS,Endpoint,VM2,R53Resolver,R53Private component
```

The beauty of this setup is that AWS treats the query as originating from the region where its Route 53 Resolver inbound endpoint is located. This means that when Azure UK South forwards its queries to AWS eu-west-2, it receives geographically appropriate responses, making our closest-instance routing possible.

## The Reality of Implementation

For on-premises networks, the solution becomes more nuanced. The implementation requires regional DNS conditional forwarders, with each region's clients needing to forward their queries to the appropriate regional AWS resolver. This adds a layer of complexity that might make the solution less practical for some organisations.

The integration process itself reveals both the possibilities and limitations of cross-cloud solutions. While I found the technical implementation surprisingly straightforward, it requires careful planning and consideration of the operational implications.

## Conclusion

Throughout this exploration, I've discovered that this solution is technically viable. Cross-regional failover works reliably, and we can achieve basic geographic routing. The integration between Azure and AWS DNS systems is more straightforward than I expected.

However, the question isn't just whether we can implement this solution, but whether we should. While it's a fascinating technical exercise that demonstrates the possibilities of cross-cloud integration, the complexity and potential maintenance overhead make it less suitable for critical production workloads.

Perhaps the most valuable insight from this exercise isn't the solution itself, but the reminder that sometimes the best answer to a platform's limitations might lie in complementary services from other providers - even if we ultimately decide not to use them. It challenges me to think beyond single-cloud solutions while remaining pragmatic about what I actually implement in production.

I'd love to hear if you've tried similar cross-cloud approaches or if you have other solutions to these Azure DNS limitations. Drop me a message if you've tackled these challenges in a different way!
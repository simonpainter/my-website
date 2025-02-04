---

title: Cloud networking news from Ignite 2024
---

By far the stand out session for me at Ignite this year was [Unveiling the latest in Azure Networking for a secure connected cloud | BRK240](https://www.youtube.com/watch?v=Q8f6LG3ZlF0) which covered a lot of interesting anouncements and enhancements in Azure Networking; many of these are particularly relevant for things I am doing.

## Hollow Core Fibre

I predicted quite a bit of this a while back in [a Medium paper](https://medium.simonpainter.com/optimising-azure-network-architectures-leveraging-microsofts-hollow-core-fibre-innovation-4b0ec39cb33c) which was based on the information released around the Microsoft acquisition of Luminosity. By filling fibre with nitrogen instead of glass the speed at which light travels though the fibre increases and that results in a direct and dramatic reduction in latency. Globally distributed organisations which are latency sensitive get a huge performance windfall here and the planet is now quite a lot smaller from a network perspective.

## Network Security Perimeter

We all love [privatelink](private-link-services.md) right? It's a great way to secure access into your PaaS services from your vNets, and with privatelink services you can extend that protection to services you run yourself. Where there has been a gap previously is in securing communications from one PaaS to another and this has been addressed with [Network Security Perimeter](https://learn.microsoft.com/en-us/azure/private-link/network-security-perimeter-concepts). This is best thought of as an NSG around your PaaS instances, but specifically *your* instances. It includes FQDN filtering for outbound internet access which is a particularly nice touch and will be useful as more PaaS services are onboarded.

Services onboarded in November 2024

- Azure Monitor
- Azure AI Search
- Cosmos DB
- Event Hubs
- Key Vault
- SQL DB
- Storage

## ExpressRoute Metro

I had a look at this a little while ago for a project I was working on and it was in very limited preview, only in Amsterdam I think, but it didn't meet the requirements I had around scale. Although not for me, it's a great product for organisations that want multi site resillience. One of the limitations of ERs and ERDs is that they are inherently supplied as pairs in a single edge location so if you wanted site resillince you were looking at a pair of connections into one edge location and then another pair into another edge location; ExpressRoute Metro solves this by splitting a single ExpressRoute circuit pair across two physical sites.

## ExpressRoute Scalable Gateway

I have been waiting for [ErGwScale](https://learn.microsoft.com/en-us/azure/expressroute/expressroute-about-virtual-network-gateways) to go GA for a while. It's in public preview which is great but it probably means we'll need to stick to [Fastpath](https://learn.microsoft.com/en-us/azure/expressroute/about-fastpath) for our *greater than 10G* requirements for a little bit longer.

## IPAM

I am quite interested to see how this works and will be firing it up in my lab later. IPAM is close to my heart at the moment because operating at the sort of scale where 10/8 just isn't enough leads to some interesting challenges. If the capacity management reporting is as good as it looks then I'll be sharing my experience soon. 

## But

Still nothing for private cross region failover unless you opt for the [anycast](../Anycast/anycast-route-server.md) option. That solution relies on an NVA which will benefit from the [Accelerated Connections](https://learn.microsoft.com/en-us/azure/networking/nva-accelerated-connections) feature which is now in limited GA.
---

title: "Beyond Route Server: Implementing Anycast in Azure with Functions and VNet peering"

---

More about what to do about global site load balancing in Azure.

### Introduction: Where we are and why

Hopefully you are already familiar with the [only really viable cloud solution](anycast-route-server.md) for cross region load balancing for Azure *at the moment*. There are some other options available but they are mostly not very good and [often ridiculous](../cross-region-r53.md). Even the best option of the bad bunch has [some cumbersome limitations](transit-route-prevention.md), such as dealing with the [bizarre maths around Route Server](../Azure/route-server-prefix-limit.md) amongst others.
The biggest limitation to the solution is that it involves an NVA; for many, NVAs feel like the slightly dirty and embarassing necessity of cloud that we'd all rather avoid. Mention NVAs in most cloud first organisations and screams of *pet* will be heard for miles. Those screams may well be justified, when they are made with reasoned arguements rather than dogmatic purity tests, but either way there is a huge gap in Azure (for the time being at least) for an entirely cloud native solution to private internal cross region failover and some approximation of closest instance routing.

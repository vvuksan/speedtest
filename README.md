# speedtest

Drop these files to a directory where you want to run this.

On Fastly you will need these two snippets for things to work right

Recv Snippet

```
# Make sure we ignore query arguments for GIF images
if ( req.url.ext == "gif") {
  set req.url = req.url.path;
}
# This will give us some network numbers such as RTT
if (req.url.path == "/tcpinfo") {
  error 602 "Fastly Internal";
}
```

Error Snippet

```
if (obj.status == 602 ) {
   set obj.http.Content-Type = "application/json";
   set obj.status = 200;
   set obj.response = "OK";
   synthetic "{" {""requests": "} client.requests {","cwnd":"} client.socket.cwnd {","nexthop": ""} client.socket.nexthop {"","rtt": "} client.socket.tcpi_rtt {","delta_retrans": "} client.socket.tcpi_delta_retrans {","total_retrans":"} client.socket.tcpi_total_retrans "}";
   return(deliver);
}
```
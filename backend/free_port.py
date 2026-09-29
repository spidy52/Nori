import psutil
import sys

def free_port(port=8000):
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            for conns in proc.net_connections(kind='inet'):
                if conns.laddr and conns.laddr.port == port:
                    proc.kill()
                    print(f"Freed port {port} by terminating PID {proc.info['pid']}")
        except Exception:
            pass

if __name__ == "__main__":
    p = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    free_port(p)


import time
from fastapi import Request



async def logging_middleware(request:Request,call_next):
    start=time.time()
    response=await call_next(request)
    end=time.time()

    process_time=end-start
    return response



def setup_logging():
    import logging
    import sys
    logger=logging.getLogger()
    logger.setLevel(logging.INFO)
    logger.handlers.clear()
    console_handler=logging.StreamHandler(sys.stdout)
    console_formatter=logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)
   

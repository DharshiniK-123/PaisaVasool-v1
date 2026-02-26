import sys
import time
from fastapi import Request
import logging
from logger import logger
logger=logging.getLogger()
import logging
import sys
from pythonjsonlogger import jsonlogger




async def logging_middleware(request:Request,call_next):
    start=time.time()
    response=await call_next(request)
    end=time.time()

    process_time=end-start
    log_dict={"url":request.url.path,"method":request.method,"process_time":process_time}
    logger.info(log_dict,extra=log_dict)
    return response




def setup_logging():
    logger=logging.getLogger()
    logger.setLevel(logging.INFO)
    logger.handlers.clear()

    console_handler=logging.StreamHandler(sys.stdout)
    console_formatter=logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
    console_handler.setFormatter(console_formatter)


    file_handler=logging.FileHandler("app.log")
    json_formatter=jsonlogger.JsonFormatter("%(asctime)s - %(levelname)s - %(message)s %(url)s %(method)s %(process_time)s")

    file_handler.setFormatter(json_formatter)
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
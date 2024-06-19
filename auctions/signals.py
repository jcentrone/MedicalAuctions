from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Auction
from .utils.helpers import classify_and_save_device  # Make sure this function is in your utils.py or appropriate location


# @receiver(pre_save, sender=Auction)
# def auto_categorize_auction(sender, instance, **kwargs):
#     device_data = get_device_data(instance.product_code)  # Fetch device data based on your implementation
#     category = classify_and_save_device(device_data)
#     instance.category = category

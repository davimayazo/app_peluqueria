from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_businessconfig_min_booking_notice_minutes'),
    ]

    operations = [
        migrations.AddField(
            model_name='businessconfig',
            name='show_appointments_widget',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='businessconfig',
            name='show_revenue_widget',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='businessconfig',
            name='show_services_widget',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='businessconfig',
            name='show_staff_widget',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='businessconfig',
            name='show_new_customers_widget',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='businessconfig',
            name='show_agenda_widget',
            field=models.BooleanField(default=True),
        ),
    ]

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models


class ResNetMultiChannel(nn.Module):
    def __init__(self, num_classes: int = 2):
        super().__init__()

        base = models.resnet50(weights=None)

        self.conv1 = nn.Conv2d(
            in_channels=3,
            out_channels=64,
            kernel_size=7,
            stride=2,
            padding=3,
            bias=False,
        )
        self.bn1 = base.bn1
        self.relu = base.relu
        self.maxpool = base.maxpool

        self.layer1 = base.layer1
        self.layer2 = base.layer2
        self.layer3 = base.layer3
        self.layer4 = base.layer4

        self.avgpool = base.avgpool

        # IMPORTANT:
        # state_dict expects fc.1 and fc.4
        self.fc = nn.Sequential(
            nn.Dropout(p=0.3),                 # fc.0
            nn.Linear(2048, 512),              # fc.1
            nn.ReLU(inplace=True),             # fc.2
            nn.Dropout(p=0.3),                 # fc.3
            nn.Linear(512, num_classes),       # fc.4
        )

    def forward(self, x):
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.maxpool(x)

        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)

        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.fc(x)
        return x

class GoogLeNetMultiChannel(nn.Module):
    def __init__(self, num_classes: int = 2):
        super().__init__()

        base = models.googlenet(weights=None, aux_logits=True)

        self.conv1 = base.conv1
        self.conv1.conv = nn.Conv2d(
            in_channels=3,
            out_channels=64,
            kernel_size=7,
            stride=2,
            padding=3,
            bias=False,
        )

        self.maxpool1 = base.maxpool1
        self.conv2 = base.conv2
        self.conv3 = base.conv3
        self.maxpool2 = base.maxpool2

        self.inception3a = base.inception3a
        self.inception3b = base.inception3b
        self.maxpool3 = base.maxpool3

        self.inception4a = base.inception4a
        self.inception4b = base.inception4b
        self.inception4c = base.inception4c
        self.inception4d = base.inception4d
        self.inception4e = base.inception4e
        self.maxpool4 = base.maxpool4

        self.inception5a = base.inception5a
        self.inception5b = base.inception5b

        self.avgpool = base.avgpool
        self.dropout = nn.Dropout(p=0.2)

        # IMPORTANT: checkpoint expects fc.1 and fc.4
        self.fc = nn.Sequential(
            nn.Dropout(p=0.3),          # fc.0
            nn.Linear(1024, 512),       # fc.1
            nn.ReLU(inplace=True),      # fc.2
            nn.Dropout(p=0.3),          # fc.3
            nn.Linear(512, num_classes) # fc.4
        )

        self.aux_logits = False
        self.aux1 = None
        self.aux2 = None

    def forward(self, x):
        x = self.conv1(x)
        x = self.maxpool1(x)
        x = self.conv2(x)
        x = self.conv3(x)
        x = self.maxpool2(x)

        x = self.inception3a(x)
        x = self.inception3b(x)
        x = self.maxpool3(x)

        x = self.inception4a(x)
        x = self.inception4b(x)
        x = self.inception4c(x)
        x = self.inception4d(x)
        x = self.inception4e(x)
        x = self.maxpool4(x)

        x = self.inception5a(x)
        x = self.inception5b(x)

        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.dropout(x)
        x = self.fc(x)
        return x

class ResNetGoogLeNetEnsemble(nn.Module):
    def __init__(self, num_classes: int = 2):
        super().__init__()
        self.resnet = ResNetMultiChannel(num_classes=num_classes)
        self.googlenet = GoogLeNetMultiChannel(num_classes=num_classes)

    def forward(self, x):
        logits_r = self.resnet(x)
        logits_g = self.googlenet(x)
        return (logits_r + logits_g) / 2.0


def build_resnet(num_classes: int = 2):
    return ResNetMultiChannel(num_classes=num_classes)


def build_googlenet(num_classes: int = 2):
    return GoogLeNetMultiChannel(num_classes=num_classes)


def build_ensemble(num_classes: int = 2):
    return ResNetGoogLeNetEnsemble(num_classes=num_classes)
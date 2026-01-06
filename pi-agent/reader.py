"""
Card Reader module for Pi Agent.
Provides abstraction for different card reader implementations.

This module contains:
- BaseReader: Abstract base class for card readers
- FakeReader: Mock implementation for development/testing
- TODO: RealReader: Implementation for actual hardware (e.g., MFRC522, PN532)
"""

import logging
import threading
import queue
from abc import ABC, abstractmethod
from typing import Optional, Callable

logger = logging.getLogger(__name__)


class BaseReader(ABC):
    """Abstract base class for card readers."""
    
    @abstractmethod
    def start(self, callback: Callable[[str], None]) -> None:
        """
        Start reading cards.
        
        Args:
            callback: Function to call when a card is read.
                     The callback receives the card UID as a string.
        """
        pass
    
    @abstractmethod
    def stop(self) -> None:
        """Stop reading cards."""
        pass
    
    @abstractmethod
    def is_running(self) -> bool:
        """Check if the reader is currently running."""
        pass


class FakeReader(BaseReader):
    """
    Fake card reader for development and testing.
    Reads card UIDs from standard input (terminal).
    
    Usage:
        Type a card UID in the terminal and press Enter to simulate a scan.
        Type 'quit' or 'exit' to stop the reader.
    """
    
    def __init__(self):
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._callback: Optional[Callable[[str], None]] = None
    
    def start(self, callback: Callable[[str], None]) -> None:
        """Start the fake reader thread."""
        if self._running:
            logger.warning("Reader is already running")
            return
        
        self._callback = callback
        self._running = True
        self._thread = threading.Thread(target=self._read_loop, daemon=True)
        self._thread.start()
        logger.info("Fake reader started - type card UIDs in terminal")
        print("\n" + "=" * 50)
        print("FAKE CARD READER - Development Mode")
        print("=" * 50)
        print("Type a card UID and press Enter to simulate a scan.")
        print("Type 'quit' or 'exit' to stop.")
        print("Type 'status' to see scan statistics.")
        print("=" * 50 + "\n")
    
    def stop(self) -> None:
        """Stop the fake reader."""
        self._running = False
        logger.info("Fake reader stopped")
    
    def is_running(self) -> bool:
        """Check if the reader is running."""
        return self._running
    
    def _read_loop(self) -> None:
        """Main loop for reading input from terminal."""
        while self._running:
            try:
                # Read input from terminal
                user_input = input("Card UID> ").strip()
                
                if not user_input:
                    continue
                
                if user_input.lower() in ("quit", "exit"):
                    self._running = False
                    print("Reader stopping...")
                    break
                
                if user_input.lower() == "status":
                    # Status is handled by main.py
                    if self._callback:
                        self._callback("__STATUS__")
                    continue
                
                # Simulate a card scan
                card_uid = user_input.upper()
                logger.info(f"Card scanned: {card_uid}")
                
                if self._callback:
                    self._callback(card_uid)
                    
            except EOFError:
                # End of input (e.g., piped input finished)
                logger.info("End of input, stopping reader")
                self._running = False
                break
            except KeyboardInterrupt:
                logger.info("Keyboard interrupt, stopping reader")
                self._running = False
                break
            except Exception as e:
                logger.error(f"Error reading input: {e}")


# TODO: Implement RealReader for actual hardware
# 
# class RealReader(BaseReader):
#     """
#     Real card reader implementation for Raspberry Pi.
#     
#     Supports:
#     - MFRC522 via SPI
#     - PN532 via I2C or SPI
#     
#     Example usage with MFRC522:
#     
#     from mfrc522 import SimpleMFRC522
#     
#     class RealReader(BaseReader):
#         def __init__(self):
#             self.reader = SimpleMFRC522()
#             self._running = False
#         
#         def start(self, callback):
#             self._running = True
#             while self._running:
#                 id, text = self.reader.read()
#                 if id:
#                     callback(str(id))
#     """
#     pass


def get_reader(reader_type: str = "fake") -> BaseReader:
    """
    Factory function to get the appropriate reader.
    
    Args:
        reader_type: Type of reader ("fake" or "real")
    
    Returns:
        A BaseReader instance.
    """
    if reader_type == "fake":
        return FakeReader()
    # TODO: Add support for real readers
    # elif reader_type == "real":
    #     return RealReader()
    else:
        raise ValueError(f"Unknown reader type: {reader_type}")
